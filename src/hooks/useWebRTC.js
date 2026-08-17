import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL || 'https://oditechteams-backend.onrender.com';
const ICE_SERVERS  = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

/**
 * useWebRTC — manages local media + multi-peer WebRTC connections via socket.io /meeting namespace
 *
 * @param {string}  meetingId   - Unique room identifier
 * @param {string}  userName    - Display name shown to other participants
 * @param {string}  userId      - User's database ID
 * @param {boolean} joined      - Becomes true when the user clicks "Join Now"
 * @param {boolean} isAdmin     - Whether the user is an admin
 *
 * @returns {object} {
 *   localStream, localVideoRef,
 *   peers,           // Map<socketId, { stream, userName, isMuted, isCameraOff }>
 *   isMuted, isCameraOff, isScreenSharing,
 *   toggleMic, toggleCam, toggleScreenShare,
 *   chatMessages, sendChatMessage,
 *   reactions,
 *   raiseHand,
 *   leaveRoom,
 *   mediaError,
 *   socketConnected,
 *   participantCount,
 * }
 */
export default function useWebRTC(meetingId, userName, userId, joined, isAdmin) {
  /* ── State ───────────────────────────────────────────────── */
  const [localStream,      setLocalStream]      = useState(null);
  const [peers,            setPeers]            = useState(new Map());   // socketId → peerData
  const [isMuted,          setIsMuted]          = useState(false);
  const [isCameraOff,      setIsCameraOff]      = useState(false);
  const [isScreenSharing,  setIsScreenSharing]  = useState(false);
  const [chatMessages,     setChatMessages]     = useState([]);
  const [reactions,        setReactions]        = useState([]);          // [{id, userName, emoji}]
  const [mediaError,       setMediaError]       = useState(null);        // string | null
  const [kickedMessage,    setKickedMessage]    = useState(null);
  const [socketConnected,  setSocketConnected]  = useState(false);
  const [mySocketId,       setMySocketId]       = useState(null);        // own socket id
  const [status,           setStatus]           = useState('idle');      // 'idle' | 'pending' | 'accepted' | 'rejected'
  const [pendingRequests,  setPendingRequests]  = useState([]);          // For admins: list of pending users

  /* ── Refs (survive re-renders without triggering effects) ── */
  const socketRef      = useRef(null);
  const mySocketIdRef  = useRef(null);   // own socket id ref (for sync access in callbacks)
  const localStreamRef = useRef(null);   // always up-to-date stream ref
  const peersRef       = useRef(new Map());
  const screenTrackRef = useRef(null);

  /* ── Helpers ─────────────────────────────────────────────── */
  const updatePeers = () => setPeers(new Map(peersRef.current));

  const makeInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  /* ── Acquire local media ─────────────────────────────────── */
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      } catch (err) {
        console.error('[WebRTC] getUserMedia failed:', err);
        setMediaError(
          err.name === 'NotAllowedError'
            ? 'Camera / microphone access was denied. Please allow access in your browser settings and refresh.'
            : `Could not access camera or microphone: ${err.message}`
        );
      }
    })();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  /* ── Auto-join or pending ──────────────────────────────── */
  useEffect(() => {
    if (!joined || !meetingId) return;

    console.log('[Meeting] Connecting to room:', meetingId);
    // ── Connect to /meeting namespace (no JWT needed) ─────────
    const socket = io(`${SOCKET_URL}/meeting`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Meeting] Socket connected:', socket.id);
      mySocketIdRef.current = socket.id;
      setMySocketId(socket.id);
      setSocketConnected(true);
      
      // Auto-request join
      if (isAdmin) {
        setStatus('accepted');
        socket.emit('meeting:join', { meetingId, userId, userName, isAdmin: true });
      } else {
        setStatus('pending');
        socket.emit('meeting:request-join', { meetingId, userId, userName });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    /* ── Someone already in the room ── tell me who ───────── */
    socket.on('meeting:existing-participants', (participants) => {
      participants.forEach(p => {
        // Skip if the server accidentally included ourselves
        if (p.socketId === mySocketIdRef.current) return;
        createPeerConnection(p.socketId, p.userName, true);
      });
    });

    /* ── Initial pending requests (Admin only) ─────────────── */
    socket.on('meeting:existing-requests', (requests) => {
      setPendingRequests(requests);
    });

    /* ── New join request (Admin only) ─────────────────────── */
    socket.on('meeting:join-request', (reqData) => {
      setPendingRequests(prev => {
        if (!prev.find(p => p.socketId === reqData.socketId)) {
          return [...prev, reqData];
        }
        return prev;
      });
    });

    /* ── Join request cancelled (Admin only) ───────────────── */
    socket.on('meeting:request-cancelled', ({ socketId }) => {
      setPendingRequests(prev => prev.filter(req => req.socketId !== socketId));
    });

    /* ── My request was accepted ───────────────────────────── */
    socket.on('meeting:request-accepted', () => {
      setStatus('accepted');
      socket.emit('meeting:join', { meetingId, userId, userName, isAdmin: false });
    });

    /* ── My request was rejected ───────────────────────────── */
    socket.on('meeting:request-rejected', () => {
      setStatus('rejected');
    });

    /* ── New user arrived after us ─────────────────────────── */
    socket.on('meeting:user-joined', ({ socketId, userName: peerName }) => {
      // Skip self — server uses socket.to() so this shouldn't happen, but guard anyway
      if (socketId === mySocketIdRef.current) return;
      console.log('[Meeting] User joined:', peerName, socketId);
      // We are the existing user. The new user will send us an offer (because they run existing-participants).
      // So we just prepare the peer connection to receive it (shouldOffer = false).
      createPeerConnection(socketId, peerName, false);
    });

    /* ── Receive an offer from a peer ─────────────────────── */
    socket.on('meeting:offer', async ({ fromSocketId, fromUserName, offer }) => {
      console.log('[Meeting] Received offer from', fromUserName);
      const pc = createPeerConnection(fromSocketId, fromUserName, false);
      const entry = peersRef.current.get(fromSocketId);
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      if (entry) entry.isRemoteSet = true;
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('meeting:answer', { targetSocketId: fromSocketId, answer });

      // Process any queued ICE candidates
      if (entry && entry.iceQueue) {
        for (const c of entry.iceQueue) {
          pc.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.warn('Queued ICE error:', e));
        }
        entry.iceQueue = [];
      }
    });

    /* ── Receive an answer ─────────────────────────────────── */
    socket.on('meeting:answer', async ({ fromSocketId, answer }) => {
      const entry = peersRef.current.get(fromSocketId);
      if (!entry) return;
      try {
        await entry.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        entry.isRemoteSet = true;
        
        // Process any queued ICE candidates
        if (entry.iceQueue) {
          for (const c of entry.iceQueue) {
            entry.peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.warn('Queued ICE error:', e));
          }
          entry.iceQueue = [];
        }
      } catch (e) {
        console.warn('[Meeting] setRemoteDescription answer error:', e);
      }
    });

    /* ── Receive ICE candidate ─────────────────────────────── */
    socket.on('meeting:ice-candidate', async ({ fromSocketId, candidate }) => {
      const entry = peersRef.current.get(fromSocketId);
      if (!entry || !candidate) return;
      
      if (!entry.isRemoteSet) {
        entry.iceQueue.push(candidate);
        return;
      }
      
      try {
        await entry.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[Meeting] addIceCandidate error:', e);
      }
    });

    /* ── Remote mute/cam state ─────────────────────────────── */
    socket.on('meeting:mute-toggle', ({ socketId, isMuted: m }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.isMuted = m;
        updatePeers();
      }
    });

    socket.on('meeting:cam-toggle', ({ socketId, isCameraOff: c }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.isCameraOff = c;
        updatePeers();
      }
    });

    /* ── Chat message ──────────────────────────────────────── */
    socket.on('meeting:chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    /* ── Raise hand / reaction ─────────────────────────────── */
    socket.on('meeting:raise-hand', ({ userName: rUser }) => {
      const id = Date.now();
      setReactions(prev => [...prev, { id, userName: rUser, emoji: '✋' }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 4000);
    });

    /* ── Screen share notification ─────────────────────────── */
    socket.on('meeting:screen-share', ({ socketId, isSharing }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.isScreenSharing = isSharing;
        updatePeers();
      }
    });

    /* ── User left ─────────────────────────────────────────── */
    socket.on('meeting:user-left', ({ socketId }) => {
      const entry = peersRef.current.get(socketId);
      if (entry) {
        entry.peerConnection.close();
        peersRef.current.delete(socketId);
        updatePeers();
      }
    });

    /* ── Kicked ────────────────────────────────────────────── */
    socket.on('meeting:kicked', () => {
      setKickedMessage('You have been removed from the meeting by an admin.');
      leaveRoom();
    });

    return () => {
      socket.emit('meeting:leave');
      socket.disconnect();
      // Close all peer connections
      peersRef.current.forEach(entry => entry.peerConnection.close());
      peersRef.current.clear();
      updatePeers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, meetingId, userId, userName]);

  /* ── Create / configure an RTCPeerConnection ─────────────── */
  function createPeerConnection(remoteSocketId, remoteUserName, shouldOffer) {
    if (peersRef.current.has(remoteSocketId)) {
      return peersRef.current.get(remoteSocketId).peerConnection;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // ICE candidates → relay via socket
    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('meeting:ice-candidate', {
          targetSocketId: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    // Remote track arrived
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      const entry = peersRef.current.get(remoteSocketId);
      if (entry) {
        entry.stream = remoteStream;
        updatePeers();
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        peersRef.current.delete(remoteSocketId);
        updatePeers();
      }
    };

    const peerData = {
      peerConnection: pc,
      stream:         null,
      userName:       remoteUserName,
      isMuted:        false,
      isCameraOff:    false,
      isScreenSharing: false,
      iceQueue:       [],
      isRemoteSet:    false,
    };
    peersRef.current.set(remoteSocketId, peerData);
    updatePeers();

    // If we should send the offer
    if (shouldOffer) {
      (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('meeting:offer', { targetSocketId: remoteSocketId, offer });
        } catch (e) {
          console.error('[Meeting] createOffer error:', e);
        }
      })();
    }

    return pc;
  }

  /* ── Controls ────────────────────────────────────────────── */
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    const newMuted = !isMuted;
    audioTrack.enabled = !newMuted;
    setIsMuted(newMuted);
    socketRef.current?.emit('meeting:mute-toggle', { isMuted: newMuted });
  }, [isMuted]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    const newOff = !isCameraOff;
    videoTrack.enabled = !newOff;
    setIsCameraOff(newOff);
    socketRef.current?.emit('meeting:cam-toggle', { isCameraOff: newOff });
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace video track in all peer connections
        peersRef.current.forEach(({ peerConnection }) => {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        setIsScreenSharing(true);
        socketRef.current?.emit('meeting:screen-share', { isSharing: true });

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (e) {
        console.warn('[Meeting] Screen share denied:', e);
      }
    } else {
      stopScreenShare();
    }
  }, [isScreenSharing]);

  function stopScreenShare() {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      peersRef.current.forEach(({ peerConnection }) => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
    }
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setIsScreenSharing(false);
    socketRef.current?.emit('meeting:screen-share', { isSharing: false });
  }

  const sendChatMessage = useCallback((text) => {
    if (!text?.trim() || !socketRef.current) return;
    socketRef.current.emit('meeting:chat-message', { text });
  }, []);

  const raiseHand = useCallback(() => {
    socketRef.current?.emit('meeting:raise-hand');
    // Show own reaction locally too
    const id = Date.now();
    setReactions(prev => [...prev, { id, userName: 'You', emoji: '✋' }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 4000);
  }, []);

  const kickUser = useCallback((targetSocketId) => {
    socketRef.current?.emit('meeting:kick-user', { targetSocketId });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('meeting:leave');
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peersRef.current.forEach(e => e.peerConnection.close());
    peersRef.current.clear();
    updatePeers();
  }, []);

  const requestJoin = useCallback((isAdmin) => {
    if (!socketRef.current) return;
    if (isAdmin) {
      setStatus('accepted');
      socketRef.current.emit('meeting:join', { meetingId, userId, userName, isAdmin: true });
    } else {
      setStatus('pending');
      socketRef.current.emit('meeting:request-join', { meetingId, userId, userName });
    }
  }, [meetingId, userId, userName]);

  const acceptUser = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('meeting:accept-user', { targetSocketId, meetingId });
    setPendingRequests(prev => prev.filter(req => req.socketId !== targetSocketId));
  }, [meetingId]);

  const rejectUser = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('meeting:reject-user', { targetSocketId, meetingId });
    setPendingRequests(prev => prev.filter(req => req.socketId !== targetSocketId));
  }, [meetingId]);

  return {
    localStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    chatMessages,
    reactions,
    mediaError,
    socketConnected,
    status,
    pendingRequests,
    setPendingRequests,
    requestJoin,
    acceptUser,
    rejectUser,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    sendChatMessage,
    raiseHand,
    kickUser,
    leaveRoom,
    participantCount: peers.size + 1,
    mySocketId,
    makeInitials,
    kickedMessage,
  };
}
