import os
from typing import Dict, List, Optional
from app.detection.engine import default_detection_engine
from app.models.contracts import (
    Account,
    Alert,
    DetectionResult,
    RiskTier,
    Transaction,
)
from app.parser import parse_csv_transactions


class TRACEStore:
    """
    In-memory state cache for active transactions and detection results.
    Persistent data (notes, statuses, audit history) lives in SQLite.
    """

    def __init__(self):
        self.transactions: List[Transaction] = []
        self.transactions_by_id: Dict[str, Transaction] = {}
        self.accounts: Dict[str, Account] = {}
        self.detection_result: Optional[DetectionResult] = None
        self.alerts_by_id: Dict[str, Alert] = {}
        self.alerts_by_case_id: Dict[str, Alert] = {}

    def load_from_csv(self, csv_content: str) -> DetectionResult:
        txs, errors = parse_csv_transactions(csv_content)
        if not txs and errors:
            raise ValueError(f"Failed to parse CSV: {'; '.join(errors)}")

        self.transactions = txs
        self.transactions_by_id = {tx.id: tx for tx in txs}

        # Build account index
        account_ids = set([tx.sender_id for tx in txs] + [tx.receiver_id for tx in txs])
        for acc_id in account_ids:
            if acc_id not in self.accounts:
                self.accounts[acc_id] = Account(
                    id=acc_id,
                    account_number=f"****-{acc_id[-4:] if len(acc_id) >= 4 else acc_id}",
                    holder_name=f"Entity {acc_id}",
                    risk_tier=RiskTier.LOW.value,
                    account_type="BUSINESS" if "MERCH" in acc_id or "CRYPTO" in acc_id else "INDIVIDUAL",
                    created_at=txs[0].timestamp if txs else "2026-01-01T00:00:00Z",
                )

        # Run detection engine
        result = default_detection_engine.run(self.transactions)
        self.detection_result = result
        self.alerts_by_id = {a.id: a for a in result.alerts}
        self.alerts_by_case_id = {a.case_id: a for a in result.alerts}

        return result

    def load_default_dataset(self):
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data",
            "sample_transactions.csv",
        )
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                content = f.read()
            self.load_from_csv(content)

    def get_all_transactions(self) -> List[Transaction]:
        return self.transactions

    def get_transaction(self, tx_id: str) -> Optional[Transaction]:
        return self.transactions_by_id.get(tx_id)

    def get_detection_result(self) -> Optional[DetectionResult]:
        if not self.detection_result:
            self.load_default_dataset()
        return self.detection_result

    def get_all_alerts(self) -> List[Alert]:
        res = self.get_detection_result()
        return res.alerts if res else []

    def get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        return self.alerts_by_id.get(alert_id)

    def get_alert_by_case_id(self, case_id: str) -> Optional[Alert]:
        return self.alerts_by_case_id.get(case_id)

    def get_transactions_for_case(self, case_id: str) -> List[Transaction]:
        alert = self.get_alert_by_case_id(case_id)
        if not alert:
            return []
        return [
            self.transactions_by_id[tx_id]
            for tx_id in alert.related_transaction_ids
            if tx_id in self.transactions_by_id
        ]

    def get_account(self, account_id: str) -> Optional[Account]:
        if not self.accounts:
            self.load_default_dataset()
        if account_id in self.accounts:
            return self.accounts[account_id]
        # Return a consistent synthesized account entry if not indexed yet
        acc = Account(
            id=account_id,
            account_number=f"****-{account_id[-4:] if len(account_id) >= 4 else account_id}",
            holder_name=f"Entity {account_id}",
            risk_tier=RiskTier.LOW.value,
            account_type="BUSINESS" if "MERCH" in account_id or "CRYPTO" in account_id else "INDIVIDUAL",
            created_at="2026-01-01T00:00:00Z",
        )
        self.accounts[account_id] = acc
        return acc


# Singleton store instance
store = TRACEStore()
