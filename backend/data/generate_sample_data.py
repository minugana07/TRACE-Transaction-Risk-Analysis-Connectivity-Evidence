"""
Synthetic Data Generation Script for TRACE Fraud Detection Engine.
Generates realistic baseline transactions, suspicious patterns (outliers, velocity,
structuring, fan-out, layering chains), and malformed test datasets.
"""

import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path


def generate_datasets(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    base_time = datetime(2026, 10, 20, 9, 0, 0, tzinfo=timezone.utc)

    # 1. sample_valid.csv - Normal day-to-day transactions
    valid_path = output_dir / "sample_valid.csv"
    with open(valid_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_id", "sender_id", "recipient_id", "amount", "currency", "timestamp", "status", "metadata"])
        
        tx_id = 1000
        # Normal accounts: salary, rent, groceries, coffee, utilities
        for day in range(7):
            current_day = base_time + timedelta(days=day)
            
            # User 101 normal routine
            writer.writerow([f"TXN_{tx_id}", "ACC_USER_101", "MERCHANT_GROCERY_99", "84.50", "USD", (current_day + timedelta(hours=2)).isoformat(), "COMPLETED", "groceries"])
            tx_id += 1
            writer.writerow([f"TXN_{tx_id}", "ACC_USER_101", "MERCHANT_COFFEE_12", "6.75", "USD", (current_day + timedelta(hours=3, minutes=15)).isoformat(), "COMPLETED", "coffee"])
            tx_id += 1

            # User 102 routine
            writer.writerow([f"TXN_{tx_id}", "ACC_USER_102", "MERCHANT_PHARMACY_01", "32.10", "USD", (current_day + timedelta(hours=4)).isoformat(), "COMPLETED", "pharmacy"])
            tx_id += 1
            writer.writerow([f"TXN_{tx_id}", "ACC_USER_102", "ACC_USER_103", "50.00", "USD", (current_day + timedelta(hours=6)).isoformat(), "COMPLETED", "peer_transfer"])
            tx_id += 1

            # Business payroll on day 1
            if day == 0:
                writer.writerow([f"TXN_{tx_id}", "CORP_EMPLOYER_01", "ACC_USER_101", "3450.00", "USD", (current_day + timedelta(hours=1)).isoformat(), "COMPLETED", "payroll"])
                tx_id += 1
                writer.writerow([f"TXN_{tx_id}", "CORP_EMPLOYER_01", "ACC_USER_102", "3800.00", "USD", (current_day + timedelta(hours=1)).isoformat(), "COMPLETED", "payroll"])
                tx_id += 1

    # 2. sample_suspicious.csv - Normal accounts mixed with verified suspicious scenarios
    suspicious_path = output_dir / "sample_suspicious.csv"
    with open(suspicious_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_id", "sender_id", "recipient_id", "amount", "currency", "timestamp", "status", "metadata"])
        
        tx_id = 2000
        t0 = base_time

        # Scenario A: Baseline history followed by extreme outlier amount
        for i in range(5):
            writer.writerow([f"TXN_{tx_id}", "ACC_OUTLIER_01", "MERCHANT_STORE", f"{75.00 + i * 10}", "USD", (t0 + timedelta(days=i, hours=10)).isoformat(), "COMPLETED", "historical_transfer"])
            tx_id += 1
        # Sudden $18,500 transfer (over 100x historical median)
        writer.writerow([f"TXN_{tx_id}", "ACC_OUTLIER_01", "OFFSHORE_BENEFICIARY_99", "18500.00", "USD", (t0 + timedelta(days=5, hours=11)).isoformat(), "COMPLETED", "unusual_spike"])
        tx_id += 1

        # Scenario B: Rapid successive transfers (Velocity burst - 4 transfers in 9 minutes)
        burst_start = t0 + timedelta(days=2, hours=14)
        for i in range(4):
            writer.writerow([f"TXN_{tx_id}", "ACC_VELOCITY_02", f"ACC_EXT_{i+1}", f"{850.00 + i * 200}", "USD", (burst_start + timedelta(minutes=i*2.5)).isoformat(), "COMPLETED", "rapid_burst"])
            tx_id += 1

        # Scenario C: Structuring / Repeated similar amounts near regulatory threshold ($9,500)
        struct_start = t0 + timedelta(days=3, hours=8)
        amounts = [9500.00, 9450.00, 9550.00, 9480.00]
        for i, amt in enumerate(amounts):
            writer.writerow([f"TXN_{tx_id}", "ACC_STRUCTURING_03", f"ACC_MULE_{i}", f"{amt:.2f}", "USD", (struct_start + timedelta(hours=i*1.5)).isoformat(), "COMPLETED", "smurfing"])
            tx_id += 1

        # Scenario D: Sudden transaction frequency surge (normally 1 tx/week, suddenly 5 tx in 40 mins)
        writer.writerow([f"TXN_{tx_id}", "ACC_SURGE_04", "MERCHANT_TEST", "25.00", "USD", (t0 - timedelta(days=20)).isoformat(), "COMPLETED", "ancient_history"])
        tx_id += 1
        writer.writerow([f"TXN_{tx_id}", "ACC_SURGE_04", "MERCHANT_TEST", "30.00", "USD", (t0 - timedelta(days=10)).isoformat(), "COMPLETED", "ancient_history_2"])
        tx_id += 1
        surge_start = t0 + timedelta(days=4, hours=16)
        for i in range(5):
            writer.writerow([f"TXN_{tx_id}", "ACC_SURGE_04", f"BENEFICIARY_X_{i}", f"{300.00 + i * 50}", "USD", (surge_start + timedelta(minutes=i*8)).isoformat(), "COMPLETED", "frequency_surge"])
            tx_id += 1

        # Scenario E: Pass-through layering chain (A -> B -> C)
        # B receives $8,000 from A, and 20 mins later forwards $7,600 (95%) to C
        chain_t1 = t0 + timedelta(days=5, hours=12)
        chain_t2 = chain_t1 + timedelta(minutes=20)
        writer.writerow([f"TXN_{tx_id}", "ORIGIN_A", "INTERMEDIARY_B", "8000.00", "USD", chain_t1.isoformat(), "COMPLETED", "layering_inbound"])
        tx_id += 1
        writer.writerow([f"TXN_{tx_id}", "INTERMEDIARY_B", "DESTINATION_C", "7600.00", "USD", chain_t2.isoformat(), "COMPLETED", "layering_outbound"])
        tx_id += 1

        # Scenario F: Multi-recipient fan-out (1 sender to 5 recipients within 30 minutes)
        fan_start = t0 + timedelta(days=6, hours=9)
        for i in range(5):
            writer.writerow([f"TXN_{tx_id}", "ACC_FAN_OUT_05", f"MULE_RECIPIENT_{i+1}", "450.00", "USD", (fan_start + timedelta(minutes=i*5)).isoformat(), "COMPLETED", "fan_out_dispersion"])
            tx_id += 1

        # Scenario G: Legitimate repeated transfer (e.g. daily transit fare of exact same amount with unique ID)
        writer.writerow([f"TXN_{tx_id}", "ACC_NORMAL_LEGIT", "METRO_TRANSIT", "2.75", "USD", (t0 + timedelta(days=1, hours=8)).isoformat(), "COMPLETED", "transit_legit"])
        tx_id += 1
        writer.writerow([f"TXN_{tx_id}", "ACC_NORMAL_LEGIT", "METRO_TRANSIT", "2.75", "USD", (t0 + timedelta(days=2, hours=8)).isoformat(), "COMPLETED", "transit_legit"])
        tx_id += 1

    # 3. sample_malformed.csv - Deliberate edge cases and corruption
    malformed_path = output_dir / "sample_malformed.csv"
    with open(malformed_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_id", "sender_id", "recipient_id", "amount", "currency", "timestamp", "status"])
        
        # Valid row 1
        writer.writerow(["TXN_GOOD_1", "ACC_001", "ACC_002", "100.00", "USD", "2026-10-25T10:00:00Z", "COMPLETED"])
        # Missing transaction_id
        writer.writerow(["", "ACC_001", "ACC_002", "150.00", "USD", "2026-10-25T10:05:00Z", "COMPLETED"])
        # Missing sender_id
        writer.writerow(["TXN_BAD_SENDER", "", "ACC_002", "200.00", "USD", "2026-10-25T10:10:00Z", "COMPLETED"])
        # Missing recipient_id
        writer.writerow(["TXN_BAD_RECIP", "ACC_001", "", "250.00", "USD", "2026-10-25T10:15:00Z", "COMPLETED"])
        # Circular self-transfer
        writer.writerow(["TXN_SELF", "ACC_001", "ACC_001", "300.00", "USD", "2026-10-25T10:20:00Z", "COMPLETED"])
        # Negative amount
        writer.writerow(["TXN_NEG_AMT", "ACC_001", "ACC_002", "-45.00", "USD", "2026-10-25T10:25:00Z", "COMPLETED"])
        # Non-numeric amount
        writer.writerow(["TXN_NAN_AMT", "ACC_001", "ACC_002", "NOT_A_NUMBER", "USD", "2026-10-25T10:30:00Z", "COMPLETED"])
        # Invalid currency code
        writer.writerow(["TXN_BAD_CURR", "ACC_001", "ACC_002", "50.00", "TOOLONG_CURRENCY", "2026-10-25T10:35:00Z", "COMPLETED"])
        # Unparseable timestamp
        writer.writerow(["TXN_BAD_TIME", "ACC_001", "ACC_002", "50.00", "USD", "corrupted-datetime-value", "COMPLETED"])
        # Duplicate transaction ID
        writer.writerow(["TXN_GOOD_1", "ACC_001", "ACC_002", "999.00", "USD", "2026-10-25T11:00:00Z", "COMPLETED"])
        # Valid row 2
        writer.writerow(["TXN_GOOD_2", "ACC_003", "ACC_004", "500.00", "EUR", "2026-10-25T11:30:00Z", "COMPLETED"])

    print(f"Generated datasets in {output_dir}:")
    print(f"- {valid_path.name}")
    print(f"- {suspicious_path.name}")
    print(f"- {malformed_path.name}")


if __name__ == "__main__":
    import sys
    out = Path(__file__).resolve().parent if "__file__" in locals() else Path("/Users/sarayum/.gemini/antigravity/scratch/trace/data")
    generate_datasets(out)
