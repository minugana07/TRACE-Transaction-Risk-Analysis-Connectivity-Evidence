import sys
from app.store import store


def main():
    print("Loading default dataset...")
    store.load_default_dataset()
    txs = store.get_all_transactions()
    tx_ids = set(tx.id for tx in txs)
    alerts = store.get_all_alerts()

    print(f"Total Transactions Loaded: {len(txs)}")
    print(f"Total Alerts Produced: {len(alerts)}")

    assert len(txs) > 0, "No transactions loaded"
    assert len(alerts) > 0, "No alerts produced by detection engine"

    # Verify that every alert's related transactions derive from the real transaction set
    for alert in alerts:
        assert len(alert.related_transaction_ids) > 0, f"Alert {alert.id} has no related transactions"
        for r_id in alert.related_transaction_ids:
            assert r_id in tx_ids, f"Alert {alert.id} references phantom transaction {r_id} not in dataset!"

        # Verify evidence items
        assert len(alert.evidence) > 0, f"Alert {alert.id} has no evidence items"
        for ev in alert.evidence:
            assert ev.description, f"Evidence {ev.id} in {alert.id} has empty description"
            assert ev.severity in ["LOW", "MEDIUM", "HIGH", "CRITICAL"], f"Invalid severity in {ev.id}"

        # Verify case transactions
        case_txs = store.get_transactions_for_case(alert.case_id)
        assert len(case_txs) == len(alert.related_transaction_ids), (
            f"Case {alert.case_id} transaction count mismatch: "
            f"got {len(case_txs)}, expected {len(alert.related_transaction_ids)}"
        )

        # Check Risk Ripple connections: sender -> receiver edges
        senders = set(t.sender_id for t in case_txs)
        receivers = set(t.receiver_id for t in case_txs)
        print(f"  Alert [{alert.id}] ({alert.case_id}): {len(case_txs)} txs, "
              f"Priority: {alert.risk_score:.0f}/100, Senders: {senders}, Receivers: {receivers}")

    print("\n[SUCCESS] All alert evidence and Risk Ripple connections derive strictly from real dataset transactions.")


if __name__ == "__main__":
    main()
