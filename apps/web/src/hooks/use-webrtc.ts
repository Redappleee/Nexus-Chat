'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC(chatId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const chatIdRef = useRef(chatId);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const endCall = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
    setIsConnected(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);

    getSocket()?.emit(SOCKET_EVENTS.CALL_END, { chatId: chatIdRef.current });
  }, [localStream]);

  const getPc = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        setIsConnected(false);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        getSocket()?.emit(SOCKET_EVENTS.CALL_ICE, {
          chatId: chatIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const drainPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Failed to add queued ICE candidate:', err);
        }
      }
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      const pc = getPc();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        await drainPendingIceCandidates(pc);
      } catch (err) {
        console.error('Failed to set remote answer:', err);
      }
    };

    const onIce = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = getPc();
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Failed to add ICE candidate:', err);
        }
      } else if (data.candidate) {
        pendingIceCandidatesRef.current.push(data.candidate);
      }
    };

    const onEnd = () => {
      endCall();
    };

    socket.on(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
    socket.on(SOCKET_EVENTS.CALL_ICE, onIce);
    socket.on(SOCKET_EVENTS.CALL_END, onEnd);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
      socket.off(SOCKET_EVENTS.CALL_ICE, onIce);
      socket.off(SOCKET_EVENTS.CALL_END, onEnd);
    };
  }, [getPc, drainPendingIceCandidates, endCall]);

  const startCall = useCallback(
    async (video = true, callerInfo?: { name?: string; avatar?: string }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        setLocalStream(stream);
        setIsVideoMuted(!video);
        setIsAudioMuted(false);

        const pc = getPc();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        getSocket()?.emit(SOCKET_EVENTS.CALL_OFFER, {
          chatId: chatIdRef.current,
          offer,
          type: video ? 'video' : 'voice',
          callerName: callerInfo?.name,
          callerAvatar: callerInfo?.avatar,
        });
      } catch (err) {
        console.error('Failed to start call:', err);
        throw err;
      }
    },
    [getPc]
  );

  const answerCall = useCallback(
    async (offer: RTCSessionDescriptionInit, video = true) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        setLocalStream(stream);
        setIsVideoMuted(!video);
        setIsAudioMuted(false);

        const pc = getPc();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainPendingIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        getSocket()?.emit(SOCKET_EVENTS.CALL_ANSWER, {
          chatId: chatIdRef.current,
          answer,
        });
      } catch (err) {
        console.error('Failed to answer call:', err);
        throw err;
      }
    },
    [getPc, drainPendingIceCandidates]
  );

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(stream);
        setIsScreenSharing(false);

        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      } catch (err) {
        console.error('Failed to switch back to camera:', err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        const videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
          }
          navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((stream) => {
              setLocalStream(stream);
              const camTrack = stream.getVideoTracks()[0];
              const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
              if (sender && camTrack) {
                sender.replaceTrack(camTrack);
              }
            })
            .catch((err) => console.error(err));
        };

        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        setLocalStream((prev) => {
          if (!prev) return screenStream;
          const audioTracks = prev.getAudioTracks();
          const tracks = [...audioTracks, videoTrack];
          return new MediaStream(tracks);
        });
      } catch (err) {
        console.error('Failed to start screen share:', err);
      }
    }
  }, [isScreenSharing]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  }, [localStream]);

  return {
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
  };
}
