'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Phone,
  PhoneCall,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useWebRTC } from '@/hooks/use-webrtc';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import { toast } from 'sonner';

interface IncomingCallData {
  offer: RTCSessionDescriptionInit;
  type: 'voice' | 'video';
  callerName?: string;
  callerAvatar?: string;
  from?: string;
}

export function CallOverlay({ chatId }: { chatId: string }) {
  const { callActive, callType, setCallActive } = useUIStore();
  const currentUser = useAuthStore((s) => s.user);
  const {
    localStream,
    remoteStream,
    isScreenSharing,
    isAudioMuted,
    isVideoMuted,
    isConnected,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC(chatId);

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const [incoming, setIncoming] = useState<IncomingCallData | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for active call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callActive && isConnected) {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callActive, isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (callActive && callType && !startedRef.current && !incoming) {
      startedRef.current = true;
      startCall(callType === 'video', {
        name: currentUser?.displayName || currentUser?.username,
        avatar: currentUser?.avatar,
      }).catch((err) => {
        toast.error('Could not access microphone/camera. Please check permissions.');
        setCallActive(false);
      });
    }
    if (!callActive) {
      startedRef.current = false;
    }
  }, [callActive, callType, startCall, setCallActive, incoming, currentUser]);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onOffer = (data: IncomingCallData) => {
      if (callActive) return;
      setIncoming({
        offer: data.offer,
        type: data.type || 'video',
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        from: data.from,
      });
    };

    const onEnd = () => {
      setIncoming(null);
      setCallActive(false);
    };

    const onReject = () => {
      toast.info('Call declined');
      setIncoming(null);
      setCallActive(false);
    };

    socket.on(SOCKET_EVENTS.CALL_OFFER, onOffer);
    socket.on(SOCKET_EVENTS.CALL_END, onEnd);
    socket.on(SOCKET_EVENTS.CALL_REJECT, onReject);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_OFFER, onOffer);
      socket.off(SOCKET_EVENTS.CALL_END, onEnd);
      socket.off(SOCKET_EVENTS.CALL_REJECT, onReject);
    };
  }, [callActive, setCallActive]);

  const acceptIncoming = async () => {
    if (!incoming) return;
    const currentIncoming = incoming;
    setIncoming(null);
    setCallActive(true, currentIncoming.type);
    try {
      await answerCall(currentIncoming.offer, currentIncoming.type === 'video');
    } catch {
      toast.error('Failed to connect to call.');
      setCallActive(false);
    }
  };

  const rejectIncoming = () => {
    getSocket()?.emit(SOCKET_EVENTS.CALL_REJECT, { chatId });
    setIncoming(null);
  };

  const hangUp = () => {
    endCall();
    setCallActive(false);
    setIncoming(null);
  };

  return (
    <>
      {/* Hidden audio element to ensure remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <AnimatePresence>
        {/* Incoming Call Dialog */}
        {incoming && !callActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl text-center max-w-sm w-full mx-4">
              <div className="relative mb-6">
                <Avatar
                  src={incoming.callerAvatar}
                  name={incoming.callerName || 'Caller'}
                  className="h-24 w-24 border-4 border-emerald-500/30 ring-4 ring-emerald-500/10"
                />
                <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg animate-bounce">
                  {incoming.type === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-100">
                {incoming.callerName || 'Incoming Call'}
              </h3>
              <p className="mt-1 text-sm text-emerald-400 font-medium capitalize">
                Incoming {incoming.type} call...
              </p>

              <div className="mt-8 flex w-full justify-center gap-6">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={rejectIncoming}
                  className="rounded-full px-6 py-6 shadow-lg shadow-red-500/20"
                >
                  <PhoneOff className="mr-2 h-5 w-5" />
                  Decline
                </Button>
                <Button
                  size="lg"
                  onClick={acceptIncoming}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-6 shadow-lg shadow-emerald-500/20"
                >
                  <PhoneCall className="mr-2 h-5 w-5" />
                  Accept
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Call UI */}
        {callActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white"
          >
            {/* Call Status Header */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md border border-white/10">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {isConnected ? `Connected · ${formatDuration(callDuration)}` : 'Calling...'}
              </span>
              <span className="text-xs text-zinc-500 capitalize">({callType} call)</span>
            </div>

            {/* Main Video Screen / Voice Placeholder */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-zinc-900">
              {remoteStream ? (
                <video
                  ref={remoteRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-zinc-400">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-zinc-800 ring-4 ring-emerald-500/20">
                    <User className="h-16 w-16 text-zinc-500" />
                    {!isConnected && (
                      <span className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-300">
                    {isConnected ? 'In call' : 'Waiting for connection...'}
                  </p>
                </div>
              )}

              {/* Local PiP Video Screen */}
              {callType === 'video' && (
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="absolute bottom-28 right-6 z-20 h-44 w-32 overflow-hidden rounded-2xl border border-white/20 bg-black/80 shadow-2xl backdrop-blur"
                >
                  {isVideoMuted ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-800 text-zinc-400">
                      <VideoOff className="h-6 w-6" />
                      <span className="text-[10px] mt-1">Camera Off</span>
                    </div>
                  ) : (
                    <video
                      ref={localRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3 rounded-full bg-zinc-900/90 px-6 py-3 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                {/* Mute Button */}
                <Button
                  size="icon"
                  variant={isAudioMuted ? 'destructive' : 'secondary'}
                  className="h-12 w-12 rounded-full"
                  onClick={toggleMute}
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                >
                  {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {/* Video Toggle Button */}
                {callType === 'video' && (
                  <Button
                    size="icon"
                    variant={isVideoMuted ? 'destructive' : 'secondary'}
                    className="h-12 w-12 rounded-full"
                    onClick={toggleVideo}
                    title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                  >
                    {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}

                {/* Screen Share Button */}
                {callType === 'video' && (
                  <Button
                    size="icon"
                    variant={isScreenSharing ? 'default' : 'secondary'}
                    className={`h-12 w-12 rounded-full ${isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                  >
                    <Monitor className="h-5 w-5" />
                  </Button>
                )}

                {/* Hang Up Button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
                  onClick={hangUp}
                  title="End call"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
