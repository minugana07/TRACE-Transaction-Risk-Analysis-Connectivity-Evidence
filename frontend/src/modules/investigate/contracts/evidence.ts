export type EvidenceCategory =
  | 'OBSERVED_TRANSACTION'
  | 'VELOCITY_METRIC'
  | 'GRAPH_CONNECTIVITY'
  | 'GEOGRAPHIC_DISPERSION'
  | 'SYSTEM_FLAG';

/**
 * Objective observed evidence item.
 * Must strictly capture observed factual data points rather than subjective analyst interpretation.
 */
export interface EvidenceItem {
  evidenceId: string;
  category: EvidenceCategory;
  observedFact: string; // Factual observation statement (e.g. "3 transactions totaling $28,500 executed in 4 minutes")
  dataPoints: Record<string, unknown>;
  source: string; // e.g., "CORE_LEDGER", "DEVICE_TELEMETRY", "GRAPH_ENGINE"
  timestamp: string; // ISO 8601
}
