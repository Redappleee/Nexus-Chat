'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  '✨ Draft a quick, friendly reply',
  '📝 Summarize our discussion',
  '💼 Make my message more professional',
  '💡 Brainstorm creative ideas',
];

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm Nexus AI, your built-in assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/assistant', {
        message: userMsg.content,
        history: updatedHistory,
      });
      setMessages((m) => [...m, { role: 'assistant', content: data.data.reply }]);
    } catch {
      toast.error('AI assistant is temporarily unavailable.');
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How else can I assist you?",
      },
    ]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 z-50 flex h-full w-full max-w-full sm:max-w-sm flex-col border-l border-white/[0.08] bg-[#090d16]/95 backdrop-blur-3xl shadow-2xl"
          >
            {/* AI Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-md shadow-emerald-500/20">
                  <Bot className="h-5 w-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-zinc-950" />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                    Nexus AI
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Gemini
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Smart chat & assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                  onClick={clearChat}
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* AI Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[88%] shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-sm shadow-emerald-950/20'
                        : 'bg-zinc-800/90 text-zinc-200 rounded-bl-sm border border-white/[0.08] backdrop-blur-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium p-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Thinking...</span>
                </div>
              )}

              {/* Quick Prompts */}
              {messages.length <= 2 && !loading && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Quick suggestions
                  </p>
                  <div className="space-y-1.5">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send(prompt)}
                        className="flex w-full items-center text-left rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] px-3 py-2 text-xs text-zinc-300 hover:text-emerald-300 transition-all hover:translate-x-1"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Prompt Input Bar */}
            <div className="border-t border-white/[0.08] p-3 bg-black/40">
              <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/90 border border-white/[0.1] p-1.5 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Ask Nexus AI anything..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
                <Button
                  size="icon"
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
