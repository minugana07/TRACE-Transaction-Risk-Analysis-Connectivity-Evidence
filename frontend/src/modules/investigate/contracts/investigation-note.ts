export type NoteType =
  | 'ANALYST_INTERPRETATION'
  | 'PROCEDURAL_UPDATE'
  | 'SUPERVISORY_REVIEW';

/**
 * Case investigation note recorded by analysts or supervisors.
 * Explicitly distinguishes analyst hypothesis / interpretation from observed immutable facts.
 */
export interface InvestigationNote {
  noteId: string;
  caseId: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO 8601
  type: NoteType;
  content: string;
}
