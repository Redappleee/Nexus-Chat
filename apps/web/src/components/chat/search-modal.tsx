'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<
    {
      _id: string;
      content?: string;
      chat: { _id: string; name?: string; type: string };
      sender: { displayName: string };
    }[]
  >([]);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  const search = async () => {
    if (!q.trim()) return;
    try {
      const { data } = await api.get('/chats/search/messages', { params: { q } });
      setResults(data.data || []);
    } catch {
      setResults([]);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-20 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                autoFocus
                placeholder="Search across all messages..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                className="w-full rounded-2xl border border-white/[0.1] bg-black/40 pl-10 pr-4 py-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <Button
              onClick={search}
              className="rounded-2xl px-5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs font-semibold"
            >
              Search
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl" onClick={onClose}>
              <X className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
            {results.map((m) => (
              <button
                key={m._id}
                type="button"
                className="group flex w-full items-center justify-between rounded-2xl p-3 text-left bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all"
                onClick={() => {
                  setActiveChat(m.chat._id);
                  onClose();
                }}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-emerald-400">{m.sender.displayName}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">in {m.chat.name || 'Direct Chat'}</span>
                  </div>
                  <p className="text-xs text-zinc-300 truncate group-hover:text-white">{m.content}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}

            {q && !results.length && (
              <div className="py-12 text-center text-zinc-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-xs font-medium text-zinc-400">No matching messages found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
