/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ScenarioInteractive - Interactive roleplay scenario simulator
 */

import React, { useState } from 'react';
import { ScamScenario } from '../../contracts/scamShield';
import { ExplainBackCard } from './ExplainBackCard';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface ScenarioInteractiveProps {
  scenario: ScamScenario;
  onBack: () => void;
  onCompleteScenario?: (scenarioId: string, passed: boolean) => void;
}

export const ScenarioInteractive: React.FC<ScenarioInteractiveProps> = ({
  scenario,
  onBack,
  onCompleteScenario
}) => {
  const { highContrast } = useAccessibility();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [explainBackDone, setExplainBackDone] = useState(false);

  const selectedDecision = scenario.decisionOptions.find((d) => d.id === selectedDecisionId);

  const narrationText = `Educational Scenario: ${scenario.title}. ${scenario.shortSummary}. Background: ${scenario.realWorldContext}. Pay close attention to red flags like asking for your UPI PIN or urgent threats.`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline min-h-[36px]"
        >
          ← Back to Scenario Catalog
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
            Channel: {scenario.channel}
          </span>
          <VoiceReaderButton textToRead={narrationText} label="Listen to Scenario" />
        </div>
      </div>

      {/* Scenario Title & Context */}
      <div>
        <h2 className="text-xl font-bold">{scenario.title}</h2>
        <p className="text-sm opacity-85 mt-1 leading-relaxed">{scenario.realWorldContext}</p>
      </div>

      {/* Fictional Message Simulator Screen */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        highContrast ? 'bg-black border-2 border-yellow-400 text-white' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
      }`}>
        <div className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 border-b border-current/10 flex items-center justify-between text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Fictional {scenario.channel} Simulation (Safe Training)
          </span>
          <span className="opacity-60 text-[11px]">Strictly Simulated</span>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {scenario.fictionalMessages.map((msg) => {
            const isScammer = msg.sender === 'scammer';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-3">
                  <div className="inline-block p-2.5 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium max-w-md">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  isScammer ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isScammer ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {msg.avatarText}
                </div>
                <div>
                  <div className="text-[10px] opacity-60 mb-0.5 font-medium px-1">
                    {msg.senderName} • {msg.timestamp}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isScammer
                      ? highContrast
                        ? 'bg-zinc-900 border border-yellow-400 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning Signs Explained */}
      <div className={`p-5 rounded-2xl border ${
        highContrast ? 'border-yellow-400 bg-zinc-900 text-white' : 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
      }`}>
        <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
          <span>🚩</span>
          <span>Red Flags to Catch in This Situation:</span>
        </h3>
        <div className="space-y-2">
          {scenario.warningSigns.map((sign, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-rose-200/60 dark:border-rose-900/60 text-xs">
              <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                "{sign.phrase}"
              </span>
              <span className="opacity-90">{sign.explanation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Point: Multiple Choice */}
      <div className={`p-5 rounded-2xl border ${
        highContrast ? 'bg-black border-2 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <h3 className="font-bold text-base mb-1 flex items-center gap-2">
          <span>⚖️</span>
          <span>Your Decision: {scenario.decisionPrompt}</span>
        </h3>
        <p className="text-xs opacity-75 mb-4">Choose the safe course of action:</p>

        <div className="space-y-2.5">
          {scenario.decisionOptions.map((opt) => {
            const isSelected = selectedDecisionId === opt.id;
            let style = highContrast
              ? 'border-yellow-400 bg-zinc-900 text-white hover:bg-zinc-800'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40';

            if (isSelected) {
              style = opt.isSafe
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : 'bg-rose-600 text-white border-rose-600 font-semibold';
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedDecisionId(opt.id)}
                className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-start gap-3 min-h-[50px] ${style}`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 font-bold text-xs">
                  {isSelected ? (opt.isSafe ? '✓' : '✕') : '•'}
                </span>
                <span className="leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback */}
        {selectedDecision && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs animate-fade-in ${
              selectedDecision.isSafe
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-100'
            }`}
          >
            <div className="font-bold text-sm mb-1">{selectedDecision.immediateFeedback}</div>
            <p className="leading-relaxed">{selectedDecision.explanation}</p>
          </div>
        )}
      </div>

      {/* Explain-Back Verification */}
      {selectedDecision && (
        <div className="animate-fade-in">
          <ExplainBackCard
            explainBack={scenario.explainBack}
            onCompleted={(correct) => {
              setExplainBackDone(true);
              if (onCompleteScenario) {
                onCompleteScenario(scenario.id, selectedDecision.isSafe && correct);
              }
            }}
          />
        </div>
      )}

      {/* Safe Next Steps Guidance */}
      {explainBackDone && (
        <div className={`p-5 rounded-2xl border animate-fade-in ${
          highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
        }`}>
          <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
            <span>🛡️</span>
            <span>What to Do if This Happens to You in Real Life:</span>
          </h3>
          <ul className="space-y-1.5 text-xs opacity-90">
            {scenario.safeNextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
