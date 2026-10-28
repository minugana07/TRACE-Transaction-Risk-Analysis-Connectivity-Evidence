import React, { useState } from 'react';
import type { InvestigationNote } from '../../types/trace';
import { addCaseNote } from '../../services/api';
import { MessageSquare, Send, Clock, User, ShieldCheck, Loader2 } from 'lucide-react';

interface CaseNotesPanelProps {
  caseId: string;
  notes: InvestigationNote[];
  currentStatus: string;
  onNoteAdded: (newNote: InvestigationNote) => void;
  onStatusChanged: (newStatus: string) => void;
}

export const CaseNotesPanel: React.FC<CaseNotesPanelProps> = ({
  caseId,
  notes,
  currentStatus,
  onNoteAdded,
  onStatusChanged,
}) => {
  const [noteText, setNoteText] = useState('');
  const [authorName, setAuthorName] = useState('Lead Analyst');
  const [statusChange, setStatusChange] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await addCaseNote(caseId, {
        case_id: caseId,
        author: authorName,
        note: noteText.trim(),
        status_change: statusChange || undefined,
      });

      onNoteAdded(created);
      if (statusChange) {
        onStatusChanged(statusChange);
      }
      setNoteText('');
      setStatusChange('');
    } catch (err: any) {
      setError(err.message || 'Failed to record note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0C182B] border border-[#1E314B] rounded-lg p-5 shadow space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E314B]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#06B6D4]" />
          <h3 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
            Persistent Investigation Log & SQLite Notes
          </h3>
        </div>
        <span className="text-[11px] text-[#94A3B8] font-mono">
          {notes.length} record{notes.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Existing Notes Timeline */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-[#94A3B8] italic py-4 text-center">
            No notes logged yet. Use the form below to record findings or hypotheses.
          </p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="p-3 bg-[#08101E] border border-[#1E314B] rounded space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                <span className="flex items-center gap-1 font-medium text-[#F8FAFC]">
                  <User className="w-3 h-3 text-[#06B6D4]" /> {n.author}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#94A3B8] font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#F8FAFC] leading-relaxed">{n.note}</p>
              {n.status_change && (
                <div className="inline-flex items-center gap-1 text-[10px] bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded font-mono font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#F59E0B]" /> Status set to {n.status_change}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Note Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-[#1E314B] space-y-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            className="w-1/3 bg-[#08101E] border border-[#1E314B] rounded px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
          />
          <select
            value={statusChange}
            onChange={(e) => setStatusChange(e.target.value)}
            className="flex-1 bg-[#08101E] border border-[#1E314B] rounded px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
          >
            <option value="">Keep status ({currentStatus})</option>
            <option value="IN_PROGRESS">Change to IN_PROGRESS</option>
            <option value="ESCALATED">Change to ESCALATED</option>
            <option value="RESOLVED_BENIGN">Resolve as BENIGN</option>
            <option value="RESOLVED_FRAUD">Resolve as CONFIRMED FRAUD</option>
            <option value="CLOSED">Change to CLOSED</option>
          </select>
        </div>

        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Log findings, customer correspondence, or audit justifications..."
          className="w-full bg-[#08101E] border border-[#1E314B] rounded p-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-1 focus:ring-[#06B6D4] resize-none"
        />

        {error && <p className="text-xs text-[#EF4444]">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !noteText.trim()}
            className="px-4 py-1.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-50 text-[#060D1A] rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Save to SQLite DB
          </button>
        </div>
      </form>
    </div>
  );
};
