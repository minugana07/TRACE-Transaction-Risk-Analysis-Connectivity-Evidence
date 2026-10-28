/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ScamShieldHome - Educational scenario selector and progress hub
 */

import React, { useState } from 'react';
import { SCAM_SCENARIOS } from '../../data/scamScenarios';
import { ScamScenario } from '../../contracts/scamShield';
import { ScenarioInteractive } from './ScenarioInteractive';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

export const ScamShieldHome: React.FC = () => {
  const { highContrast } = useAccessibility();
  const [activeScenario, setActiveScenario] = useState<ScamScenario | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, boolean>>({});

  const handleScenarioDone = (id: string, passed: boolean) => {
    setCompletedScenarios((prev) => ({ ...prev, [id]: passed }));
  };

  if (activeScenario) {
    return (
      <ScenarioInteractive
        scenario={activeScenario}
        onBack={() => setActiveScenario(null)}
        onCompleteScenario={handleScenarioDone}
      />
    );
  }

  const completedCount = Object.values(completedScenarios).filter(Boolean).length;
  const introVoice = `ScamShield Interactive Academy. Practice recognizing digital payment scams safely. You have completed ${completedCount} out of ${SCAM_SCENARIOS.length} scenarios. Choose a scenario below to start practicing.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🛡️</span>
            <span>ScamShield - Interactive Scam Simulator</span>
          </h2>
          <p className="text-xs opacity-75 mt-1">
            Build defense reflexes through realistic roleplay exercises. No real money or credentials used.
          </p>
        </div>

        <VoiceReaderButton textToRead={introVoice} label="Listen to Overview" />
      </div>

      {/* Progress banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
            {completedCount}/{SCAM_SCENARIOS.length}
          </div>
          <div>
            <div className="font-bold text-sm">Learning Progress</div>
            <div className="text-xs opacity-80">
              {completedCount === SCAM_SCENARIOS.length
                ? 'All master scenarios passed! You have solid fraud defense reflexes.'
                : `${completedCount} scenario(s) mastered so far. Keep practicing!`}
            </div>
          </div>
        </div>

        <div className="hidden sm:block text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-current/10">
          Safety Score: {Math.round((completedCount / SCAM_SCENARIOS.length) * 100)}%
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCAM_SCENARIOS.map((scen) => {
          const isPassed = completedScenarios[scen.id];

          return (
            <div
              key={scen.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between hover:shadow-md ${
                highContrast
                  ? 'bg-black border-2 border-yellow-400 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800">
                    {scen.channel} • {scen.scamType.replace(/_/g, ' ')}
                  </span>
                  {isPassed && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                      ✓ Completed
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base mb-1.5">{scen.title}</h3>
                <p className="text-xs opacity-80 leading-relaxed mb-4">{scen.shortSummary}</p>

                {/* Key Warning Sign Preview */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs mb-4">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 block text-[11px] uppercase tracking-wide">
                    Red Flag Covered:
                  </span>
                  <span className="opacity-90">{scen.warningSigns[0].phrase}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveScenario(scen)}
                className={`min-h-[44px] w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                }`}
              >
                <span>{isPassed ? 'Replay Exercise →' : 'Start Simulation →'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
