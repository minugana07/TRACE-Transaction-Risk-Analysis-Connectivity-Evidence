"""
TRACE Rules Package.
Provides registry of deterministic fraud detection rules.
"""

from typing import List
from trace_engine.rules.base import BaseRule
from trace_engine.rules.unusual_amount import UnusualAmountRule
from trace_engine.rules.rapid_velocity import RapidVelocityRule
from trace_engine.rules.repeated_amounts import RepeatedAmountsRule
from trace_engine.rules.frequency_spike import FrequencySpikeRule
from trace_engine.rules.connected_chains import ConnectedChainsRule


def get_default_rules() -> List[BaseRule]:
    """
    Returns an instantiated list of all standard TRACE deterministic rules.
    """
    return [
        UnusualAmountRule(),
        RapidVelocityRule(),
        RepeatedAmountsRule(),
        FrequencySpikeRule(),
        ConnectedChainsRule(),
    ]


__all__ = [
    "BaseRule",
    "UnusualAmountRule",
    "RapidVelocityRule",
    "RepeatedAmountsRule",
    "FrequencySpikeRule",
    "ConnectedChainsRule",
    "get_default_rules",
]
