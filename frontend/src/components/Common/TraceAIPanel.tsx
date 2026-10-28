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
      <div className="bg-[#0C182B] border border-[#1E314B] rounded-lg p-8 flex flex-col items-center justify-center text-center shadow">
        <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#F8FAFC]">TRACE AI Grounding Engine</p>
        <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
          Synthesizing transaction records, triggered rules, and empirical evidence chain...
        </p>
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="bg-[#0C182B] border border-[#EF4444]/40 rounded-lg p-6 text-center shadow">
        <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#F8FAFC]">TRACE AI Synthesis Notice</p>
        <p className="text-xs text-[#94A3B8] mt-1">{error || 'Unable to retrieve explanation'}</p>
        <button
          onClick={() => loadExplanation()}
          className="mt-3 px-3 py-1.5 bg-[#08101E] hover:bg-[#12233D] text-xs text-[#F8FAFC] rounded inline-flex items-center gap-1.5 border border-[#1E314B] transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4]" /> Retry Synthesis
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0C182B] border border-[#1E314B] rounded-lg p-5 shadow space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[#1E314B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#06B6D4]/15 border border-[#06B6D4]/30 rounded text-[#06B6D4]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">
                TRACE AI Case Intelligence
              </h3>
              <span className="text-[10px] bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded font-mono font-bold">
                {explanation.engine_used}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">{explanation.headline}</p>
          </div>
        </div>

        <button
          onClick={() => loadExplanation()}
          title="Refresh AI synthesis"
          className="p-1.5 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#08101E] rounded transition border border-transparent hover:border-[#1E314B]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Strict Separation: Empirical Observations vs Analytical Inferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empirical Observations (Facts) */}
        <div className="bg-[#08101E] border border-[#1E314B] rounded p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#06B6D4] uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Empirical Observations (Facts)
          </div>
          <ul className="text-xs text-[#F8FAFC] space-y-1.5 list-disc list-inside">
            {explanation.observations.map((obs, idx) => (
              <li key={idx} className="leading-relaxed">
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Inferences & Typologies (Hypotheses) */}
        <div className="bg-[#08101E] border border-[#1E314B] rounded p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] uppercase tracking-wider font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            Inferences & Typology Hypotheses
          </div>
          <ul className="text-xs text-[#F8FAFC] space-y-1.5 list-disc list-inside">
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
        <div className="bg-[#08101E]/60 border border-[#1E314B] rounded p-3.5">
          <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5 text-[#06B6D4]" />
            Limitations & Benign Alternatives
          </div>
          <ul className="text-xs text-[#94A3B8] space-y-1 list-disc list-inside">
            {explanation.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Cautious Next Steps */}
      {explanation.recommended_actions && explanation.recommended_actions.length > 0 && (
        <div className="bg-[#08101E] border border-[#06B6D4]/30 rounded p-3.5">
          <div className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            Recommended Cautious Next Steps
          </div>
          <div className="space-y-1.5">
            {explanation.recommended_actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#F8FAFC]">
                <span className="text-[#06B6D4] font-bold font-mono text-[11px] mt-0.5">
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
          className="flex-1 bg-[#08101E] border border-[#1E314B] rounded px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
        />
        <button
          type="submit"
          disabled={isSubmittingQuery || !userQuery.trim()}
          className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-50 text-[#060D1A] rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow"
        >
          {isSubmittingQuery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Ask
        </button>
      </form>

      {/* Mandatory Regulatory / Safety Disclaimer */}
      <p className="text-[10px] text-[#94A3B8] italic pt-1 border-t border-[#1E314B]/70">
        {explanation.disclaimer}
      </p>
    </div>
  );
};
