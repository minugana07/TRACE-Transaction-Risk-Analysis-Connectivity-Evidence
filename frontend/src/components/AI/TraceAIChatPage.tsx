import React, { useState, useRef, useEffect } from 'react';
import type { Alert, AIChatMessage } from '../../types/trace';
import { sendAIChatMessage } from '../../services/api';
import {
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

interface TraceAIChatPageProps {
  alerts: Alert[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  mode: 'investigate' | 'protect_me';
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#F8FAFC]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-[#080D1B] text-[#60A5FA] border border-[#25324A] font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-[#94A3B8]">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-sm font-bold text-[#F8FAFC] pt-2 pb-1 border-b border-[#25324A]/60 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span>{renderInlineFormatting(trimmed.substring(4))}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h3
              key={idx}
              className="text-sm font-black text-[#F8FAFC] pt-2.5 pb-1 border-b border-[#25324A] flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>{renderInlineFormatting(text)}</span>
            </h3>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-[#F8FAFC]">
              <span className="text-[#2563EB] font-bold text-sm leading-none mt-0.5">•</span>
              <span className="flex-1">{renderInlineFormatting(trimmed.substring(2))}</span>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-[#F8FAFC]">
              <span className="font-mono text-[10px] font-bold text-[#60A5FA] px-1.5 py-0.5 rounded bg-[#080D1B] border border-[#25324A] flex-shrink-0">
                {numMatch[1]}
              </span>
              <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="text-[#F8FAFC]/90">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

export const TraceAIChatPage: React.FC<TraceAIChatPageProps> = ({
  alerts,
  activeCaseId,
  onSelectCase,
  mode,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        mode === 'investigate'
          ? "Welcome to **TRACE AI Analyst Assistant**. I am connected to the live financial surveillance engine and transaction ledger. You can ask me to explain specific case evidence, break down triggered forensic detection rules, evaluate structuring or mule typologies, or answer any AML/CFT compliance question."
          : "Hello! I am your **TRACE Safety Assistant**. I'm here to help you review unusual payments, understand scam warnings, and take safe actions to protect your money. Feel free to ask me any question!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine_used: 'TRACE Intelligence Core',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendAIChatMessage({
        message: textToSend,
        case_id: selectedCase || undefined,
        mode,
        history,
      });

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine_used: res.engine_used,
        case_id: res.case_id,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Communication Error**: ${err.message || 'Unable to communicate with TRACE AI. Please verify your backend server on port 8001.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine_used: 'System Fault Recovery',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          mode === 'investigate'
            ? "New session started. How can I assist with your investigation today?"
            : "New session started. How can I help protect your accounts?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine_used: 'TRACE Intelligence Core',
      },
    ]);
  };

  const samplePrompts =
    mode === 'investigate'
      ? [
          'Explain the evidence chain and triggered rules for this case.',
          'What are the primary indicators of money mule structuring?',
          'How does TRACE differentiate normal volatility from fraud velocity?',
          'What are the recommended next steps before filing a SAR?',
        ]
      : [
          'Why did I receive an alert on my account?',
          'What should I do if someone calls asking for an OTP code?',
          'Is it safe to transfer money for an online job task?',
          'How do I freeze my account immediately?',
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-5xl mx-auto bg-[#0C1425] border border-[#25324A] rounded-2xl shadow-2xl overflow-hidden">
      {/* Chat Workspace Header */}
      <div className="p-4 bg-[#0A1020] border-b border-[#25324A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white rounded-xl shadow-lg shadow-[#2563EB]/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F8FAFC]">
                {mode === 'investigate' ? 'TRACE AI Forensic Assistant' : 'TRACE AI Safety Advisor'}
              </h2>
              <span className="text-[10px] font-mono bg-[#111A2E] text-[#60A5FA] border border-[#25324A] px-2 py-0.5 rounded-full">
                GEMINI & GROUNDED ENGINE
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              {mode === 'investigate'
                ? 'Evidence-grounded dialogue, typology explanation, and case intelligence'
                : 'Empathetic consumer assistance, scam identification, and step-by-step guidance'}
            </p>
          </div>
        </div>

        {/* Case Context Selector & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#080D1B] border border-[#25324A] rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[#94A3B8] font-mono text-[11px]">Context:</span>
            <select
              value={selectedCase}
              onChange={(e) => {
                setSelectedCase(e.target.value);
                if (e.target.value) onSelectCase(e.target.value);
              }}
              className="bg-transparent text-[#F8FAFC] font-mono text-xs focus:outline-none"
            >
              <option value="">General Scope (No specific case)</option>
              {alerts.map((a) => (
                <option key={a.case_id} value={a.case_id} className="bg-[#080D1B] text-[#F8FAFC]">
                  {a.case_id} — {a.customer_id} ({a.priority})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNewConversation}
            className="p-2 rounded-xl bg-[#080D1B] hover:bg-[#111A2E] border border-[#25324A] text-[#94A3B8] hover:text-[#F8FAFC] transition"
            title="Start new conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#111A2E] border border-[#25324A] flex items-center justify-center text-[#7C3AED] flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2 shadow-lg leading-relaxed ${
                  isUser
                    ? 'bg-[#2563EB] text-white rounded-br-none'
                    : 'bg-[#111A2E] border border-[#25324A] text-[#F8FAFC] rounded-bl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 text-[10px] pb-1 border-b border-white/10 opacity-80 font-mono">
                  <span className="font-semibold">{isUser ? 'You' : 'TRACE AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body with Clean Formatting */}
                <FormattedMessage content={msg.content} isUser={isUser} />

                {/* AI Metadata Badge */}
                {!isUser && msg.engine_used && (
                  <div className="pt-2 border-t border-[#25324A]/60 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                      Engine: {msg.engine_used}
                    </span>
                    {msg.case_id && <span>Case Ref: {msg.case_id}</span>}
                  </div>
                )}

                {/* Follow-up Suggestions Chips */}
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-lg bg-[#080D1B] hover:bg-[#16223B] border border-[#25324A] text-[10px] text-[#60A5FA] transition text-left"
                      >
                        {sug} &rarr;
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#111A2E] border border-[#25324A] flex items-center justify-center text-[#7C3AED] flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 text-xs text-[#94A3B8] flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
              <span>Analyzing ledger records and synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-[#0A1020] border-t border-[#25324A] flex items-center gap-2 overflow-x-auto text-xs flex-shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
          <span className="text-[11px] text-[#94A3B8] flex-shrink-0 font-mono">Suggestions:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 bg-[#111A2E] hover:bg-[#16223B] border border-[#25324A] text-[11px] text-[#F8FAFC] rounded-lg whitespace-nowrap transition flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Composer */}
      <div className="p-4 bg-[#0A1020] border-t border-[#25324A] flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2.5"
        >
          <div className="flex-1 bg-[#080D1B] border border-[#25324A] rounded-xl p-2.5 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'investigate'
                  ? 'Ask TRACE AI anything (e.g., Explain the structuring pattern in CASE-1, or What is a money mule?)...'
                  : 'Ask TRACE AI anything (e.g., Why was my transfer held? What should I do if a caller claims to be my bank?)...'
              }
              className="w-full bg-transparent text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-1">
              <span>Press <b>Enter</b> to send &bull; <b>Shift + Enter</b> for new line</span>
              <span className="font-mono">Grounding: Strict Empirical Ledger</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-xl transition shadow-lg shadow-[#2563EB]/25 flex items-center justify-center flex-shrink-0"
            title="Send Message"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
