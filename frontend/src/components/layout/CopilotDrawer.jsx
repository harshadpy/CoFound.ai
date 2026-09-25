import React, { useState, useRef, useEffect } from 'react';
import { 
    X, Send, Bot, Sparkles, RefreshCw, User, 
    Lightbulb, FileText, ChevronRight, Compass 
} from 'lucide-react';
import { useStore } from '../../store/useStore';

// Lightweight native Markdown parser for Copilot messages
function FormattedMessage({ text }) {
    if (!text) return null;
    const paragraphs = text.split('\n\n');
    return (
        <div className="space-y-2">
            {paragraphs.map((para, i) => {
                const lines = para.split('\n');
                return (
                    <div key={i} className="space-y-1">
                        {lines.map((line, j) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('# ')) {
                                return <h1 key={j} className="font-bold text-sm text-foreground mt-1 mb-0.5">{trimmed.slice(2)}</h1>;
                            }
                            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                                return <h2 key={j} className="font-bold text-xs text-foreground mt-1 mb-0.5">{trimmed.replace(/^#+\s/, '')}</h2>;
                            }
                            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                return (
                                    <div key={j} className="flex items-start gap-1.5 pl-1 text-[11.5px]">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(2)) }} />
                                    </div>
                                );
                            }
                            if (/^\d+\.\s/.test(trimmed)) {
                                const num = trimmed.match(/^(\d+)\.\s/)[1];
                                const rest = trimmed.replace(/^\d+\.\s/, '');
                                return (
                                    <div key={j} className="flex items-start gap-1.5 pl-1 text-[11.5px]">
                                        <span className="text-indigo-500 font-semibold font-mono text-[10px] mt-0.5">{num}.</span>
                                        <span dangerouslySetInnerHTML={{ __html: renderInline(rest) }} />
                                    </div>
                                );
                            }
                            return (
                                <p key={j} className="text-[11.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function renderInline(str) {
    if (!str) return '';
    return str
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">$1</code>');
}


export default function CopilotDrawer() {
    const { 
        copilotOpen, 
        closeCopilot, 
        copilotMessages, 
        copilotLoading, 
        suggestedFollowups, 
        sendCopilotMessage,
        currentAnalysisId,
        analysisResult
    } = useStore();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (copilotOpen) {
            scrollToBottom();
        }
    }, [copilotMessages, copilotOpen]);

    if (!copilotOpen) return null;

    const handleSend = (e) => {
        e?.preventDefault();
        if (!input.trim() || copilotLoading) return;
        const text = input;
        setInput('');
        sendCopilotMessage(text, currentAnalysisId);
    };

    const handleSelectFollowup = (promptText) => {
        sendCopilotMessage(promptText, currentAnalysisId);
    };

    const activeDossierTitle = analysisResult?.title || 
        analysisResult?.structured_thought?.core_idea || 
        (analysisResult?.raw_text ? analysisResult.raw_text.slice(0, 45) + '...' : null);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
            <div 
                className="w-full max-w-lg h-full bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E1322] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Executive AI Copilot</h3>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    GPT-5.6-Luna
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                VC Partner & Institutional Strategy Advisor
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={closeCopilot}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Grounding Context Banner */}
                {activeDossierTitle && (
                    <div className="px-5 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-300">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">
                            <strong>Grounded on:</strong> {activeDossierTitle}
                        </span>
                    </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    {copilotMessages.map((msg, idx) => {
                        const isAssistant = msg.role === 'assistant';
                        return (
                            <div 
                                key={idx} 
                                className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                            >
                                {isAssistant && (
                                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                    isAssistant 
                                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm'
                                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                }`}>
                                    {isAssistant ? (
                                        <FormattedMessage text={msg.content} />
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                                {!isAssistant && (
                                    <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                        You
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {copilotLoading && (
                        <div className="flex gap-3 justify-start items-center text-xs text-slate-400 animate-pulse">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                                Analyzing market evidence & drafting strategic response...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested follow-up prompt pills */}
                {suggestedFollowups.length > 0 && !copilotLoading && (
                    <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-[#0B0F19] flex gap-1.5 overflow-x-auto no-scrollbar">
                        {suggestedFollowups.map((pill, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectFollowup(pill)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <Lightbulb className="w-3 h-3 text-amber-500" />
                                {pill}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input form */}
                <form 
                    onSubmit={handleSend}
                    className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0E1322] flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Copilot about pricing, moats, pitch angles..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={copilotLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || copilotLoading}
                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 shadow-sm transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
