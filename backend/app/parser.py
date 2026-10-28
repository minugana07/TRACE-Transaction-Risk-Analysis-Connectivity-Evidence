import csv
import io
from typing import List, Tuple
from app.models.contracts import GeographicData, Transaction


REQUIRED_COLUMNS = ["id", "timestamp", "sender_id", "receiver_id", "amount"]


def parse_csv_transactions(csv_content: str) -> Tuple[List[Transaction], List[str]]:
    """
    Parses CSV text into a validated list of Transaction models.
    Returns (valid_transactions, error_messages).
    """
    transactions = []
    errors = []

    # Strip potential UTF-8 BOM
    if csv_content.startswith("\ufeff"):
        csv_content = csv_content[1:]

    reader = csv.DictReader(io.StringIO(csv_content))
    fieldnames = [f.strip() for f in (reader.fieldnames or [])]

    # Validate required headers
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in fieldnames]
    if missing_cols:
        return [], [f"CSV missing mandatory column(s): {', '.join(missing_cols)}"]

    for row_idx, row in enumerate(reader, start=2):
        row_clean = {k.strip(): (v.strip() if v else "") for k, v in row.items() if k}
        tx_id = row_clean.get("id")
        if not tx_id:
            errors.append(f"Row {row_idx}: missing transaction 'id'")
            continue

        try:
            amount = float(row_clean.get("amount", 0.0))
        except ValueError:
            errors.append(f"Row {row_idx} ({tx_id}): invalid numerical amount '{row_clean.get('amount')}'")
            continue

        # Optional geographic data
        lat_raw = row_clean.get("latitude")
        lon_raw = row_clean.get("longitude")
        lat = None
        lon = None
        if lat_raw:
            try:
                lat = float(lat_raw)
            except ValueError:
                pass
        if lon_raw:
            try:
                lon = float(lon_raw)
            except ValueError:
                pass

        geo_data = None
        if lat is not None or lon is not None or row_clean.get("city") or row_clean.get("country"):
            geo_data = GeographicData(
                city=row_clean.get("city") or None,
                country=row_clean.get("country") or None,
                latitude=lat,
                longitude=lon,
                ip_address=row_clean.get("ip_address") or None,
                device_id=row_clean.get("device_id") or None,
            )

        tx = Transaction(
            id=tx_id,
            timestamp=row_clean.get("timestamp", ""),
            sender_id=row_clean.get("sender_id", ""),
            receiver_id=row_clean.get("receiver_id", ""),
            amount=amount,
            currency=row_clean.get("currency") or "USD",
            channel=row_clean.get("channel") or "ONLINE",
            status=row_clean.get("status") or "COMPLETED",
            geographic_data=geo_data,
            description=row_clean.get("description") or None,
            risk_score=float(row_clean["risk_score"]) if row_clean.get("risk_score") else None,
        )
        transactions.append(tx)

    return transactions, errors
