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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Persistent Investigation Log & SQLite Notes
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {notes.length} record{notes.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Existing Notes Timeline */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No notes logged yet. Use the form below to record findings or hypotheses.
          </p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <User className="w-3 h-3 text-indigo-400" /> {n.author}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{n.note}</p>
              {n.status_change && (
                <div className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                  <ShieldCheck className="w-3 h-3" /> Status set to {n.status_change}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Note Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800 space-y-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={statusChange}
            onChange={(e) => setStatusChange(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !noteText.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Save to SQLite DB
          </button>
        </div>
      </form>
    </div>
  );
};
