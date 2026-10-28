"""
Unit tests for CSV Transaction Ingestion & Validation.
Tests column resolution, format validation, duplicate handling, and rejection tracking.
"""

from pathlib import Path
import pytest
from trace_engine.ingestion import ingest_transactions_csv
from trace_engine.schemas import TransactionStatus


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def test_ingest_valid_csv():
    """Verify ingestion of valid CSV dataset."""
    valid_csv_path = DATA_DIR / "sample_valid.csv"
    result = ingest_transactions_csv(valid_csv_path)

    assert result.total_rows_read > 0
    assert result.valid_count == result.total_rows_read
    assert result.rejected_count == 0
    assert result.duplicate_count == 0
    assert len(result.transactions) == result.valid_count

    # Verify first transaction structure
    tx0 = result.transactions[0]
    assert tx0.transaction_id.startswith("TXN_")
    assert tx0.sender_id.startswith("ACC_") or tx0.sender_id.startswith("CORP_")
    assert tx0.amount > 0
    assert tx0.currency == "USD"
    assert tx0.timestamp.tzinfo is not None
    assert tx0.status == TransactionStatus.COMPLETED


def test_ingest_malformed_csv():
    """Verify malformed CSV yields granular rejected row audit without silent data loss."""
    malformed_path = DATA_DIR / "sample_malformed.csv"
    result = ingest_transactions_csv(malformed_path)

    # 11 total rows in sample_malformed.csv: 2 valid rows, 9 rejected
    assert result.total_rows_read == 11
    assert result.valid_count == 2
    assert result.rejected_count == 9
    assert result.duplicate_count == 1  # 1 duplicate TXN_GOOD_1

    # Check error types present in rejected rows
    error_types = {r.error_type for r in result.rejected_rows}
    assert "MISSING_TRANSACTION_ID" in error_types
    assert "MISSING_SENDER_ID" in error_types
    assert "MISSING_RECIPIENT_ID" in error_types
    assert "CIRCULAR_SELF_TRANSFER" in error_types
    assert "INVALID_AMOUNT" in error_types
    assert "INVALID_CURRENCY" in error_types
    assert "INVALID_TIMESTAMP" in error_types
    assert "DUPLICATE_TRANSACTION_ID" in error_types

    # Ensure all rejected rows contain line numbers and raw data
    for rejected in result.rejected_rows:
        assert rejected.row_index > 0
        assert isinstance(rejected.raw_data, dict)
        assert len(rejected.error_details) > 0


def test_ingest_column_aliases():
    """Verify flexible header alias mapping (e.g. from_account, txn_amount, datetime)."""
    csv_data = """id,from_account,to_account,txn_amount,curr,datetime,state
T100,SENDER_A,RECIP_B,150.25,eur,2026-10-25T14:30:00Z,COMPLETED
T101,SENDER_C,RECIP_D,2500.00,usd,2026-10-25T15:00:00Z,PENDING
"""
    result = ingest_transactions_csv(csv_data)
    assert result.valid_count == 2
    assert result.rejected_count == 0
    assert result.transactions[0].sender_id == "SENDER_A"
    assert result.transactions[0].recipient_id == "RECIP_B"
    assert result.transactions[0].amount == 150.25
    assert result.transactions[0].currency == "EUR"
    assert result.transactions[1].status == TransactionStatus.PENDING


def test_duplicate_id_vs_legitimate_repeated_transfers():
    """
    Verify duplicate IDs are rejected, but legitimate repeated transfers
    with unique IDs (same amount, sender, recipient) are preserved.
    """
    csv_data = """transaction_id,sender_id,recipient_id,amount,timestamp
TX_LEGIT_1,ACC_100,ACC_200,50.00,2026-10-25T10:00:00Z
TX_LEGIT_2,ACC_100,ACC_200,50.00,2026-10-25T10:00:00Z
TX_LEGIT_1,ACC_100,ACC_200,50.00,2026-10-25T10:00:00Z
"""
    result = ingest_transactions_csv(csv_data)
    # Rows 1 and 2 are accepted (distinct IDs)
    # Row 3 is duplicate of Row 1 (same ID) -> rejected
    assert result.valid_count == 2
    assert result.rejected_count == 1
    assert result.duplicate_count == 1
    assert result.rejected_rows[0].error_type == "DUPLICATE_TRANSACTION_ID"


def test_empty_csv():
    """Verify empty CSV string or file returns clean zero-count result without crashing."""
    result = ingest_transactions_csv("")
    assert result.total_rows_read == 0
    assert result.valid_count == 0
    assert result.rejected_count == 0


def test_missing_mandatory_headers():
    """Verify CSV with missing essential headers rejects all rows with clear diagnostic."""
    csv_data = "some_random_col,another_col\nval1,val2\n"
    result = ingest_transactions_csv(csv_data)
    assert result.valid_count == 0
    assert result.rejected_count == 1
    assert result.rejected_rows[0].error_type == "MISSING_REQUIRED_COLUMNS"
