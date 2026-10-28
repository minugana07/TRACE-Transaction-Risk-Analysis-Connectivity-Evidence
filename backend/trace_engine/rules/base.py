"""
Base Rule interface for TRACE explainable fraud detection.
All rules must implement this contract to produce standardized evidence,
limitations, and score evaluations.
"""

from abc import ABC, abstractmethod
from typing import List, Tuple
from trace_engine.config import DetectionConfig
from trace_engine.schemas import Alert, Transaction


class BaseRule(ABC):
    """
    Abstract base class for all TRACE detection rules.
    """

    def __init__(self, rule_id: str, rule_name: str, description: str):
        self.rule_id = rule_id
        self.rule_name = rule_name
        self.description = description

    @abstractmethod
    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        """
        Evaluate transactions against the rule and return zero or more Alerts.
        Must strictly separate observed facts from inferred risk.
        Must record missing-data limitations if baseline history is insufficient.
        """
        pass
