/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ExplainBackCard - Checks comprehension of warning signs
 */

import React, { useState } from 'react';
import { ExplainBackQuestion } from '../../contracts/scamShield';
import { useAccessibility } from '../../context/AccessibilityContext';

interface ExplainBackCardProps {
  explainBack: ExplainBackQuestion;
  onCompleted?: (isCorrect: boolean) => void;
}

export const ExplainBackCard: React.FC<ExplainBackCardProps> = ({ explainBack, onCompleted }) => {
  const { highContrast } = useAccessibility();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const selectedOption = explainBack.options.find((o) => o.id === selectedOptionId);

  const handleSelect = (id: string) => {
    setSelectedOptionId(id);
    const opt = explainBack.options.find((o) => o.id === id);
    if (onCompleted && opt) {
      onCompleted(opt.isCorrect);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highContrast
          ? 'bg-black border-2 border-yellow-400 text-white'
          : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🧠</span>
        <h4 className="font-bold text-base text-purple-900 dark:text-purple-300">
          Explain-Back Check: Do You Know Why?
        </h4>
      </div>

      <p className="text-xs opacity-75 mb-3">{explainBack.promptGuidance}</p>

      <p className="text-sm font-semibold mb-4 leading-relaxed">
        {explainBack.question}
      </p>

      {/* Options */}
      <div className="space-y-2.5">
        {explainBack.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          let btnStyle = highContrast
            ? 'border-yellow-400 bg-zinc-900 text-white hover:bg-zinc-800'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-400';

          if (isSelected) {
            btnStyle = option.isCorrect
              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
              : 'bg-rose-600 text-white border-rose-600 font-semibold';
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 min-h-[48px] ${btnStyle}`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 font-bold text-[11px]">
                {isSelected ? (option.isCorrect ? '✓' : '✕') : '•'}
              </span>
              <span className="leading-relaxed">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback box */}
      {selectedOption && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs animate-fade-in ${
            selectedOption.isCorrect
              ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-medium'
              : 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-100'
          }`}
          role="alert"
        >
          <div className="font-bold mb-1">
            {selectedOption.isCorrect ? '✓ Excellent understanding!' : '⚠️ Not quite.'}
          </div>
          <p>{selectedOption.feedback}</p>
        </div>
      )}

      {/* Key rule banner */}
      <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-900/50 text-xs font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
        <span>💡</span>
        <span>{explainBack.keyRuleToRemember}</span>
      </div>
    </div>
  );
};
