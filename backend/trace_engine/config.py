"""
Configurable detection thresholds and rule parameters for TRACE.
Allows operational tuning without modifying detection logic.
"""

from typing import Dict
from pydantic import BaseModel, Field


class UnusualAmountConfig(BaseModel):
    enabled: bool = True
    min_history_count: int = Field(3, description="Minimum prior transactions required to establish baseline")
    multiplier_threshold: float = Field(3.5, description="Flag if amount exceeds median historical amount by this factor")
    z_score_threshold: float = Field(3.0, description="Flag if amount exceeds mean by this many standard deviations")
    min_amount_to_flag: float = Field(250.0, description="Minimum absolute amount to evaluate to prevent noise on micro-transfers")
    base_severity_score: float = Field(35.0, description="Score contribution when triggered")


class RapidVelocityConfig(BaseModel):
    enabled: bool = True
    window_minutes: int = Field(15, description="Sliding window in minutes to evaluate transfer velocity")
    min_transfers: int = Field(3, description="Minimum transfers within window to trigger alert")
    cumulative_amount_threshold: float = Field(1000.0, description="Cumulative amount threshold to escalate priority")
    base_severity_score: float = Field(40.0, description="Score contribution when triggered")


class RepeatedAmountsConfig(BaseModel):
    enabled: bool = True
    window_hours: int = Field(24, description="Time window in hours to group similar transfers")
    min_occurrences: int = Field(3, description="Minimum similar transfers to trigger structuring rule")
    tolerance_ratio: float = Field(0.05, description="Percentage variance allowed (e.g. 0.05 = +/- 5%)")
    structuring_range_min: float = Field(8000.0, description="Lower bound for structuring near reporting limit")
    structuring_range_max: float = Field(9999.99, description="Upper bound near typical regulatory thresholds")
    base_severity_score: float = Field(35.0, description="Score contribution when triggered")


class FrequencySpikeConfig(BaseModel):
    enabled: bool = True
    short_window_hours: int = Field(2, description="Short term observation window in hours")
    min_short_window_transfers: int = Field(4, description="Minimum transactions in short window to evaluate spike")
    frequency_ratio_threshold: float = Field(3.5, description="Ratio of short-term rate to historical rate")
    base_severity_score: float = Field(30.0, description="Score contribution when triggered")


class ConnectedChainsConfig(BaseModel):
    enabled: bool = True
    fan_out_recipients_threshold: int = Field(4, description="Unique recipients from a single sender in fan-out window")
    fan_out_window_hours: int = Field(2, description="Window in hours to evaluate fan-out dispersion")
    chain_pass_through_ratio: float = Field(0.75, description="Min fraction of inbound funds passed to next recipient")
    chain_window_hours: int = Field(4, description="Max delay between inbound and outbound transfer in a chain")
    base_severity_score: float = Field(45.0, description="Score contribution when triggered")


class DetectionConfig(BaseModel):
    """
    Global configuration object for the TRACE fraud detection engine.
    """
    unusual_amount: UnusualAmountConfig = Field(default_factory=UnusualAmountConfig)
    rapid_velocity: RapidVelocityConfig = Field(default_factory=RapidVelocityConfig)
    repeated_amounts: RepeatedAmountsConfig = Field(default_factory=RepeatedAmountsConfig)
    frequency_spike: FrequencySpikeConfig = Field(default_factory=FrequencySpikeConfig)
    connected_chains: ConnectedChainsConfig = Field(default_factory=ConnectedChainsConfig)

    # Score bands
    low_priority_threshold: float = Field(30.0, description="Scores below this are LOW priority")
    medium_priority_threshold: float = Field(60.0, description="Scores between this and high are MEDIUM")
    high_priority_threshold: float = Field(80.0, description="Scores above this are HIGH (>=90 is CRITICAL)")
