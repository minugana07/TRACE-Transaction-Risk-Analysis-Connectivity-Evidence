"""
CSV Transaction Ingestion & Validation Pipeline for TRACE.
Parses CSV files, normalizes schemas, verifies identifiers, amounts, timestamps, and currencies,
and provides structured rejected-row reporting without silent data loss.
"""

import io
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import dateutil.parser
import pandas as pd

from trace_engine.schemas import (
    IngestionResult,
    RejectedRow,
    Transaction,
    TransactionStatus,
)

# Common column name variations mapped to canonical TRACE field names
COLUMN_ALIASES: Dict[str, List[str]] = {
    "transaction_id": ["transaction_id", "txn_id", "tx_id", "id", "reference_id"],
    "sender_id": ["sender_id", "sender", "from_account", "source_account", "originator", "payer_id"],
    "recipient_id": ["recipient_id", "recipient", "to_account", "destination_account", "beneficiary", "payee_id"],
    "amount": ["amount", "txn_amount", "value", "transfer_amount"],
    "currency": ["currency", "curr", "ccy"],
    "timestamp": ["timestamp", "datetime", "date", "tx_timestamp", "time", "created_at"],
    "status": ["status", "txn_status", "state", "transaction_status"],
}


def _resolve_column_mapping(columns: List[str]) -> Dict[str, str]:
    """
    Maps CSV headers to canonical field names using known aliases.
    """
    col_lower = {str(c).strip().lower(): c for c in columns}
    resolved = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias.lower() in col_lower:
                resolved[canonical] = col_lower[alias.lower()]
                break
    return resolved


def _clean_amount(raw_val: Any) -> Tuple[Optional[float], Optional[str]]:
    """
    Parses and validates transaction amount.
    Returns (cleaned_amount, error_message).
    """
    if raw_val is None or (isinstance(raw_val, float) and math.isnan(raw_val)):
        return None, "Amount is missing or null"

    try:
        val_str = str(raw_val).strip()
        # Strip currency symbols, commas and spaces
        cleaned = val_str.replace("$", "").replace("€", "").replace("£", "").replace(",", "")
        amount = float(cleaned)
        if math.isnan(amount) or math.isinf(amount):
            return None, "Amount cannot be NaN or infinite"
        if amount <= 0:
            return None, f"Amount must be strictly positive (got {amount})"
        return round(amount, 2), None
    except Exception as e:
        return None, f"Amount '{raw_val}' could not be converted to a positive number: {str(e)}"


def _parse_timestamp(raw_val: Any) -> Tuple[Optional[datetime], Optional[str]]:
    """
    Parses and standardizes timestamp into timezone-aware UTC datetime.
    """
    if raw_val is None or (isinstance(raw_val, float) and math.isnan(raw_val)):
        return None, "Timestamp is missing or null"

    try:
        # Check if epoch timestamp in seconds or ms
        if isinstance(raw_val, (int, float)):
            if raw_val > 1e11:  # milliseconds
                dt = datetime.fromtimestamp(raw_val / 1000.0, tz=timezone.utc)
            else:
                dt = datetime.fromtimestamp(raw_val, tz=timezone.utc)
            return dt, None

        val_str = str(raw_val).strip()
        if not val_str:
            return None, "Timestamp string is empty"

        # Try numeric string (epoch)
        if val_str.isdigit():
            epoch = float(val_str)
            if epoch > 1e11:
                return datetime.fromtimestamp(epoch / 1000.0, tz=timezone.utc), None
            return datetime.fromtimestamp(epoch, tz=timezone.utc), None

        dt = dateutil.parser.parse(val_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt, None
    except Exception as e:
        return None, f"Timestamp '{raw_val}' could not be parsed: {str(e)}"


def _clean_currency(raw_val: Any) -> Tuple[str, Optional[str]]:
    """
    Validates currency code or defaults to USD.
    """
    if raw_val is None or (isinstance(raw_val, float) and math.isnan(raw_val)) or str(raw_val).strip() == "":
        return "USD", None
    
    code = str(raw_val).strip().upper()
    if len(code) != 3 or not code.isalpha():
        return code, f"Invalid currency code '{code}'. Expected 3-letter ISO code."
    return code, None


def _clean_status(raw_val: Any) -> TransactionStatus:
    """
    Maps status strings to TransactionStatus enum.
    """
    if raw_val is None or (isinstance(raw_val, float) and math.isnan(raw_val)):
        return TransactionStatus.COMPLETED
    
    val_str = str(raw_val).strip().upper()
    try:
        return TransactionStatus(val_str)
    except ValueError:
        # Match common variants
        if "FAIL" in val_str:
            return TransactionStatus.FAILED
        if "PEND" in val_str:
            return TransactionStatus.PENDING
        if "CANC" in val_str:
            return TransactionStatus.CANCELLED
        return TransactionStatus.COMPLETED


def ingest_transactions_csv(
    source: Union[str, Path, io.TextIOBase, io.BytesIO, bytes],
) -> IngestionResult:
    """
    Ingests and validates transaction records from CSV.
    Guarantees no silent discard of data: all rejected rows are logged with clear reasons.
    Detects duplicate transaction IDs while keeping legitimate repeated transfers with unique IDs.

    Args:
        source: File path, file object, or byte buffer containing CSV data.

    Returns:
        IngestionResult with valid transactions, rejected rows, and summary counts.
    """
    result = IngestionResult()

    # Handle empty source early
    if source == "" or source == b"":
        return result

    # Convert bytes/string to buffer if necessary
    if isinstance(source, bytes):
        source_buffer = io.BytesIO(source)
    elif isinstance(source, str) and not Path(source).exists():
        # Raw CSV text passed directly
        source_buffer = io.StringIO(source)
    else:
        source_buffer = source

    try:
        df = pd.read_csv(source_buffer, dtype=str, keep_default_na=False)
    except Exception as e:
        result.rejected_rows.append(
            RejectedRow(
                row_index=0,
                raw_data={"source": str(source)},
                error_type="MALFORMED_CSV_FILE",
                error_details=f"Failed to read CSV source: {str(e)}",
            )
        )
        result.rejected_count = 1
        return result

    result.total_rows_read = len(df)
    if result.total_rows_read == 0:
        return result

    # Resolve columns
    col_map = _resolve_column_mapping(df.columns.tolist())
    required_fields = ["transaction_id", "sender_id", "recipient_id", "amount", "timestamp"]
    missing_required = [f for f in required_fields if f not in col_map]

    if missing_required:
        result.rejected_rows.append(
            RejectedRow(
                row_index=0,
                raw_data={"headers": list(df.columns)},
                error_type="MISSING_REQUIRED_COLUMNS",
                error_details=(
                    f"CSV missing mandatory column(s): {missing_required}. "
                    f"Found columns: {list(df.columns)}"
                ),
            )
        )
        result.rejected_count = result.total_rows_read
        return result

    seen_transaction_ids: Set[str] = set()

    for idx, row in df.iterrows():
        row_num = int(idx) + 1  # 1-based index matching line number (excluding header)
        raw_row_dict = row.to_dict()

        # 1. Transaction ID
        txn_id = str(row[col_map["transaction_id"]]).strip()
        if not txn_id or txn_id.lower() in ("nan", "none", "null"):
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="MISSING_TRANSACTION_ID",
                    error_details="Mandatory field 'transaction_id' is empty or missing.",
                )
            )
            continue

        # Duplicate Transaction ID detection
        if txn_id in seen_transaction_ids:
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="DUPLICATE_TRANSACTION_ID",
                    error_details=f"Duplicate transaction_id '{txn_id}' encountered. Row rejected to prevent double counting.",
                )
            )
            result.duplicate_count += 1
            continue

        # 2. Sender and Recipient Identifiers
        sender_id = str(row[col_map["sender_id"]]).strip()
        if not sender_id or sender_id.lower() in ("nan", "none", "null"):
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="MISSING_SENDER_ID",
                    error_details="Mandatory field 'sender_id' is empty.",
                )
            )
            continue

        recipient_id = str(row[col_map["recipient_id"]]).strip()
        if not recipient_id or recipient_id.lower() in ("nan", "none", "null"):
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="MISSING_RECIPIENT_ID",
                    error_details="Mandatory field 'recipient_id' is empty.",
                )
            )
            continue

        if sender_id == recipient_id:
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="CIRCULAR_SELF_TRANSFER",
                    error_details=f"Sender and recipient cannot be identical account '{sender_id}'.",
                )
            )
            continue

        # 3. Amount
        amount, amount_err = _clean_amount(row[col_map["amount"]])
        if amount_err or amount is None:
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="INVALID_AMOUNT",
                    error_details=amount_err or "Invalid amount",
                )
            )
            continue

        # 4. Currency
        curr_col = col_map.get("currency")
        curr_raw = row[curr_col] if curr_col else "USD"
        currency, curr_err = _clean_currency(curr_raw)
        if curr_err:
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="INVALID_CURRENCY",
                    error_details=curr_err,
                )
            )
            continue

        # 5. Timestamp
        timestamp, time_err = _parse_timestamp(row[col_map["timestamp"]])
        if time_err or timestamp is None:
            result.rejected_rows.append(
                RejectedRow(
                    row_index=row_num,
                    raw_data=raw_row_dict,
                    error_type="INVALID_TIMESTAMP",
                    error_details=time_err or "Invalid timestamp",
                )
            )
            continue

        # 6. Status
        status_col = col_map.get("status")
        status = _clean_status(row[status_col]) if status_col else TransactionStatus.COMPLETED

        # 7. Metadata (any extra unmapped columns)
        canonical_cols = set(col_map.values())
        extra_meta = {k: v for k, v in raw_row_dict.items() if k not in canonical_cols and v != ""}

        # Successful construction
        txn = Transaction(
            transaction_id=txn_id,
            sender_id=sender_id,
            recipient_id=recipient_id,
            amount=amount,
            currency=currency,
            timestamp=timestamp,
            status=status,
            metadata=extra_meta,
        )

        seen_transaction_ids.add(txn_id)
        result.transactions.append(txn)

    result.valid_count = len(result.transactions)
    result.rejected_count = len(result.rejected_rows)
    return result
