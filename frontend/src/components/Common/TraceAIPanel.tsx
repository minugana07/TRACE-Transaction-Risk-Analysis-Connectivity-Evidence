import React, { useState, useEffect } from 'react';
import type { AIExplanationResponse } from '../../types/trace';
import { requestAIExplanation } from '../../services/api';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Shield,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface TraceAIPanelProps {
  caseId: string;
  mode: 'investigate' | 'protect_me';
}

export const TraceAIPanel: React.FC<TraceAIPanelProps> = ({ caseId, mode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [explanation, setExplanation] = useState<AIExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState<string>('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);

  const loadExplanation = async (prompt?: string) => {
    try {
      if (!prompt) setLoading(true);
      else setIsSubmittingQuery(true);
      setError(null);

      const res = await requestAIExplanation({
        case_id: caseId,
        mode,
        user_prompt: prompt,
      });
      setExplanation(res);
      if (prompt) setUserQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate explanation');
    } finally {
      setLoading(false);
      setIsSubmittingQuery(false);
    }
  };

  useEffect(() => {
    loadExplanation();
  }, [caseId, mode]);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    loadExplanation(userQuery);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-200">TRACE AI Grounding Engine</p>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Synthesizing transaction records, triggered rules, and empirical evidence chain...
        </p>
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="bg-slate-900 border border-rose-900/50 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-300">TRACE AI Synthesis Notice</p>
        <p className="text-xs text-slate-400 mt-1">{error || 'Unable to retrieve explanation'}</p>
        <button
          onClick={() => loadExplanation()}
          className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg inline-flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Explanation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">TRACE AI Case Intelligence</h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                {explanation.engine_used}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{explanation.headline}</p>
          </div>
        </div>

        <button
          onClick={() => loadExplanation()}
          title="Refresh AI synthesis"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Strict Separation: Empirical Observations vs Analytical Inferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empirical Observations (Facts) */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Empirical Observations (Facts)
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            {explanation.observations.map((obs, idx) => (
              <li key={idx} className="leading-relaxed">
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Inferences & Typologies (Hypotheses) */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Inferences & Typology Hypotheses
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            {explanation.inferences.map((inf, idx) => (
              <li key={idx} className="leading-relaxed">
                <span>{inf}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Limitations & Alternative Explanations */}
      {explanation.limitations && explanation.limitations.length > 0 && (
        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Limitations & Benign Alternatives
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            {explanation.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Cautious Next Steps */}
      {explanation.recommended_actions && explanation.recommended_actions.length > 0 && (
        <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3.5">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Recommended Cautious Next Steps
          </div>
          <div className="space-y-1.5">
            {explanation.recommended_actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                <span className="text-indigo-400 font-bold font-mono text-[11px] mt-0.5">
                  {idx + 1}.
                </span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Query Input */}
      <form onSubmit={handleQuerySubmit} className="pt-2 flex items-center gap-2">
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder={
            mode === 'protect_me'
              ? 'Ask TRACE AI about this safety alert...'
              : 'Ask TRACE AI to analyze specific transactions or counterparty risks...'
          }
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isSubmittingQuery || !userQuery.trim()}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
        >
          {isSubmittingQuery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Ask
        </button>
      </form>

      {/* Mandatory Regulatory / Safety Disclaimer */}
      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800/60">
        {explanation.disclaimer}
      </p>
    </div>
  );
};
