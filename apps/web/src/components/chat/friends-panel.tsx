'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Check, XIcon, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function FriendsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => (await api.get('/users/friends/requests')).data.data,
    enabled: open,
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api.patch(`/users/friends/requests/${id}`, { accept }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success('Request updated');
    },
  });

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-sm border-l border-white/[0.08] bg-[#090d16]/95 p-5 shadow-2xl backdrop-blur-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
            <h2 className="font-bold text-zinc-100 flex items-center gap-2 text-sm">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              Friend Requests
            </h2>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* List of Requests */}
          <div className="space-y-2 overflow-y-auto">
            {requests.map(
              (r: { _id: string; from: { displayName: string; avatar?: string; username: string } }) => (
                <div
                  key={r._id}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.06] transition-all"
                >
                  <Avatar src={r.from.avatar} name={r.from.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-zinc-100 truncate">{r.from.displayName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">@{r.from.username}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400"
                      onClick={() => respond.mutate({ id: r._id, accept: true })}
                      title="Accept"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400"
                      onClick={() => respond.mutate({ id: r._id, accept: false })}
                      title="Decline"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )}

            {!requests.length && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-xs font-medium text-zinc-300">No pending requests</p>
                <p className="text-[11px] text-zinc-500 mt-1">When someone sends you a request, it will appear here</p>
              </div>
            )}
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
