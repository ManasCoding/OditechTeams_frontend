import API_URL, { getMediaUrl } from '../../api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Smile, Paperclip, Video, Phone, MoreVertical, Search as SearchIcon, Lock, MessageSquare, Trash2, ChevronDown, X } from 'lucide-react';
import { socket } from '../../socket';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import CallScreen from './CallScreen';
import IncomingCallPopup from './IncomingCallPopup';
import MessageBubble from '../../components/chat/MessageBubble';
import DateSeparator from '../../components/chat/DateSeparator';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ReplyPreview from '../../components/chat/ReplyPreview';
import AttachmentPreview from '../../components/chat/AttachmentPreview';
import { useChat } from '../../hooks/useChat';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ICE servers â€” using Google's public STUN servers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function ChatView() {
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  // ── Reply / Attachment state ─────────────────────────────────
  const [replyTo, setReplyTo] = useState(null);
  const [attachment, setAttachment] = useState(null); // { fileUrl, fileType, fileName, fileSize, localPreview }

  // â”€â”€â”€ Calling State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [callState, setCallState] = useState('idle');   // idle | calling | ringing | connected | ended
  const [callType, setCallType] = useState('audio');    // audio | video
  const [callPartner, setCallPartner] = useState(null); // the other user's info
  const [callId, setCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const peerRef = useRef(null);   // RTCPeerConnection
  const callPartnerIdRef = useRef(null);
  const callIdRef = useRef(null);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id || currentUser.id;
  const token = sessionStorage.getItem('token');

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const callTypeRef = useRef(callType);
  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  // Initialization & Socket setup
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    const loadData = async () => {
      try {
        const [convRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/api/conversations?userId=${currentUserId}`),
          fetch(`${API_URL}/api/users`)
        ]);
        const convData = await convRes.json();
        const usersData = await usersRes.json();

        if (convData.success) {
          // Filter out conversations that are direct messages with oneself
          const validConvs = convData.conversations.filter(c => 
            c.isGroup || c.participants.some(p => (p._id || p) !== currentUserId)
          );
          setConversations(validConvs);
          if (validConvs.length > 0) {
            setActiveChat(validConvs[0]);
          }
        }
        if (usersData.success) {
          setAllUsers(usersData.users);
        }
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    
    loadData();

    socket.on('receive_message', (msg) => {
      const isFromMe = (msg.senderId?._id || msg.senderId) === currentUserId;
      const convId = msg.conversationId?._id || msg.conversationId;

      // Recipient acknowledges delivery if conversation is not active or active
      if (!isFromMe && msg._id) {
        socket.emit('message_delivered', {
          messageIds: [msg._id],
          conversationId: convId,
          senderId: msg.senderId?._id || msg.senderId
        });
      }

      setConversations((prev) => {
        let found = false;
        const updated = prev.map(c => {
          if (c._id === convId) {
            found = true;
            const isCurrentActive = activeChatRef.current && activeChatRef.current._id === convId;
            let newUnread = c.unreadCount || 0;
            if (isCurrentActive) {
              newUnread = 0;
            } else if (!isFromMe) {
              newUnread += 1;
            }
            return { ...c, latestMessage: msg, unreadCount: newUnread, updatedAt: msg.createdAt || new Date().toISOString() };
          }
          return c;
        });

        // Reorder conversations so newest message is at top
        updated.sort((a, b) => {
          const dateA = new Date(a.latestMessage?.createdAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.latestMessage?.createdAt || b.updatedAt || 0).getTime();
          return dateB - dateA;
        });

        return updated;
      });
    });

    socket.on('message_delivered', ({ roomId, messageIds = [] }) => {
      setConversations(prev => prev.map(c => {
        if (c.latestMessage && (c._id === roomId || messageIds.some(id => id.toString() === c.latestMessage._id?.toString()))) {
          if (c.latestMessage.status !== 'seen' && c.latestMessage.status !== 'read' && c.latestMessage.messageStatus !== 'seen') {
            return {
              ...c,
              latestMessage: { ...c.latestMessage, status: 'delivered', messageStatus: 'delivered' }
            };
          }
        }
        return c;
      }));
    });

    socket.on('message_seen', ({ roomId }) => {
      setConversations(prev => prev.map(c => {
        if (c._id === roomId && c.latestMessage) {
          return {
            ...c,
            latestMessage: { ...c.latestMessage, status: 'seen', messageStatus: 'seen' }
          };
        }
        return c;
      }));
    });

    socket.on('typing', ({ userId, roomId }) => {
      setTypingUsers((prev) => ({ ...prev, [roomId]: userId }));
    });

    socket.on('stop_typing', ({ roomId }) => {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });
    });

    socket.on('user_online', (userId) => {
      setConversations((prev) => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => p._id === userId ? { ...p, isOnline: true } : p)
      })));
      setAllUsers((prev) => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, isOnline: true } : u));
    });

    socket.on('user_offline', ({ userId, lastSeen }) => {
      setConversations((prev) => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => p._id === userId ? { ...p, isOnline: false, lastSeen } : p)
      })));
      setAllUsers((prev) => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, isOnline: false, lastSeen } : u));
    });

    // ─── Calling Socket Events ────────────────────────────────────────
    socket.on('incoming_call', ({ from, callType: ct, callerInfo, callId: cid }) => {
      setIncomingCall({ from, callType: ct, callerInfo, callId: cid });
    });

    socket.on('call_accepted', async ({ from }) => {
      setCallState('connected');
      try {
        const pc = createPeerConnection(from);
        const stream = await navigator.mediaDevices.getUserMedia(
          callTypeRef.current === 'video' ? { audio: true, video: true } : { audio: true, video: false }
        );
        setLocalStream(stream);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: from, offer });
      } catch (err) {
        console.error('Error creating offer:', err);
        cleanupCall();
      }
    });

    socket.on('call_rejected', () => {
      setCallState('ended');
      cleanupCall(true);
    });

    socket.on('offer', async ({ from, offer }) => {
      try {
        const pc = createPeerConnection(from);
        const stream = await navigator.mediaDevices.getUserMedia(
          { audio: true, video: callTypeRef.current === 'video' }
        );
        setLocalStream(stream);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
        setCallState('connected');
      } catch (err) {
        console.error('Error handling offer:', err);
        cleanupCall();
      }
    });

    socket.on('answer', async ({ answer }) => {
      try {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      try {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('call_ended', () => {
      setCallState('ended');
      cleanupCall(true);
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_delivered');
      socket.off('message_seen');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice_candidate');
      socket.off('call_ended');
      socket.disconnect();
    };
  }, [token, currentUserId]);

  // ── useChat hook — message state, send, edit, delete, react ──────
  const {
    messages,
    isAtBottom,
    newMsgCount,
    handleScroll,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    scrollToMessage,
    markReadNow,
  } = useChat({ activeChat, currentUserId, token });

  // Auto-scroll when messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // ── File Upload Handler ──────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    const fileType = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio'
      : file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'document'
      : 'file';

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setAttachment({ fileUrl: data.fileUrl, fileType, fileName: file.name, fileSize: file.size, localPreview });
      }
    } catch (err) {
      console.error('File upload failed', err);
    }
    e.target.value = '';
  };

  // ── Upgraded send ────────────────────────────────────────────────
  const handleSendMessage = () => {
    const text = messageInput.trim();
    if ((!text && !attachment) || !activeChat) return;
    sendMessage({ text, replyTo, attachment });
    setMessageInput('');
    setReplyTo(null);
    setAttachment(null);
    socket.emit('stop_typing', { roomId: activeChat._id });
  };

  // ── Debounced typing ─────────────────────────────────────────────
  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!activeChat) return;
    if (e.target.value) {
      socket.emit('typing', { roomId: activeChat._id });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('stop_typing', { roomId: activeChat._id });
      }, 1500);
    } else {
      clearTimeout(typingTimerRef.current);
      socket.emit('stop_typing', { roomId: activeChat._id });
    }
  };

  // â”€â”€â”€ WebRTC Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const createPeerConnection = useCallback((partnerId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    callPartnerIdRef.current = partnerId;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice_candidate', { to: partnerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupCall(true);
      }
    };

    return pc;
  }, []);

  const cleanupCall = (showEnded = false) => {
    // Stop all media tracks
    setLocalStream(prevStream => {
      if (prevStream) {
        prevStream.getTracks().forEach(t => t.stop());
      }
      return null;
    });
    setRemoteStream(null);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (showEnded) {
      setTimeout(() => {
        setCallState('idle');
        setCallPartner(null);
        setIncomingCall(null);
        setCallId(null);
      }, 2000);
    } else {
      setCallState('idle');
      setCallPartner(null);
      setIncomingCall(null);
      setCallId(null);
    }
  };

  const initiateCall = async (type) => {
    if (!activeChat || !activePartner) return;
    setCallType(type);
    setCallPartner(activePartner);
    setCallState('calling');
    callPartnerIdRef.current = activePartner._id;
    socket.emit('call_user', {
      to: activePartner._id,
      callType: type,
      callerInfo: { fullName: currentUser.fullName, _id: currentUserId }
    }, (response) => {
      if (response && response.callId) {
        setCallId(response.callId);
        callIdRef.current = response.callId;
      }
    });
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const { from, callType: ct, callId: cid } = incomingCall;
    setCallType(ct);
    setCallState('connected');
    setCallId(cid);
    callIdRef.current = cid;
    // Find partner info
    const partner = allUsers.find(u => u._id === from) || { fullName: 'User', _id: from };
    setCallPartner(partner);
    socket.emit('accept_call', { to: from, callId: cid });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    const { from, callId: cid } = incomingCall;
    socket.emit('reject_call', { to: from, callId: cid });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    const duration = 0; // computed from timer inside CallScreen
    socket.emit('end_call', {
      to: callPartnerIdRef.current,
      callId: callIdRef.current,
      duration,
    });
    setCallState('ended');
    cleanupCall(true);
  };

  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(m => !m);
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(c => !c);
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOff(s => !s);
  };

  const startNewChat = async (user) => {
    // Check if conversation already exists
    const existing = conversations.find(c => !c.isGroup && c.participants.some(p => p._id === user._id));
    if (existing) {
      setActiveChat(existing);
      setSearch('');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: false,
          participants: [currentUserId, user._id]
        })
      });
      const data = await res.json();
      if (data.success) {
        // Fetch full populated conversation to have partner details
        const popRes = await fetch(`${API_URL}/api/conversations?userId=${currentUserId}`);
        const popData = await popRes.json();
        if (popData.success) {
          setConversations(popData.conversations);
          const newlyCreated = popData.conversations.find(c => c._id === data.conversation._id);
          setActiveChat(newlyCreated || data.conversation);
          setSearch('');
        }
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      const res = await fetch(`${API_URL}/api/conversations/${chatId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c._id !== chatId));
        if (activeChat?._id === chatId) {
          setActiveChat(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
        <p className="text-gray-500 max-w-md">Your security token is missing. Please log out and log back in to activate the real-time chat feature.</p>
      </div>
    );
  }

  // UI Helpers
  const getChatPartner = (conv) => {
    if (conv.isGroup) return null;
    return conv.participants.find(p => (p._id || p) !== currentUserId) || conv.participants[0];
  };

  const filteredConversations = conversations.filter(c => {
    const partner = getChatPartner(c);
    const name = c.isGroup ? c.name : (partner?.fullName || '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activePartner = activeChat ? getChatPartner(activeChat) : null;
  const isSomeoneTyping = activeChat && typingUsers[activeChat._id] && typingUsers[activeChat._id] !== currentUser._id;
  const partnerInitials = activePartner?.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';

  // All members filtered by search, used in sidebar
  const filteredAllUsers = allUsers.filter(u =>
    (u._id || u.id) !== currentUserId &&
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  // Users not yet in any conversation (for "New Chat" section)
  const usersWithoutConversation = filteredAllUsers.filter(u =>
    !conversations.some(c => !c.isGroup && c.participants.some(p => p._id === (u._id || u.id)))
  );

  const roleColor = (role) => {
    if (!role) return 'bg-gray-100 text-gray-500';
    if (role === 'admin' || role === 'super_admin') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  const displayRole = (role) => (role || 'member').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
  <>
    <div className="flex h-full bg-[#F8F9FD] font-sans">

      {/* â”€â”€ Left Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Direct Messages</h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <SearchIcon size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">

          {/* Recent Chats Section */}
          {filteredConversations.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Recent Chats</p>
              {filteredConversations.map(c => {
                const partner = getChatPartner(c);
                const isActive = activeChat?._id === c._id;
                const name = c.isGroup ? c.name : (partner?.fullName || 'User');
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                const latestText = c.latestMessage?.text || 'No messages yet';
                const isOnline = !c.isGroup && partner?.isOnline;
                
                return (
                  <button
                    key={c._id}
                    onClick={() => {
                      setActiveChat(c);
                      // Clear unread count for this conversation in the state
                      setConversations(prev => prev.map(conv => {
                        if (conv._id === c._id) {
                          return { ...conv, unreadCount: 0 };
                        }
                        return conv;
                      }));
                      socket.emit('message_seen', { roomId: c._id });
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all flex items-center gap-3',
                      isActive
                        ? 'bg-brand-purple/10 border border-brand-purple/20'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {c.isGroup
                          ? c.name[0]
                          : getMediaUrl(partner?.avatar)
                            ? <img src={getMediaUrl(partner.avatar)} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            : initials
                        }
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className={cn('text-sm font-semibold truncate', isActive ? 'text-brand-purple' : 'text-gray-800')}>
                          {name}
                        </p>
                        {c.latestMessage?.createdAt && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {format(new Date(c.latestMessage.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-gray-400 truncate flex-1 pr-2">{latestText}</p>
                        {c.unreadCount > 0 && (
                          <span className="bg-brand-purple text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* All Members Section */}
          {filteredAllUsers.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-1">All Members</p>
              {filteredAllUsers.map(u => {
                const isMe = (u._id || u.id) === currentUserId;
                const existingConv = conversations.find(c => !c.isGroup && c.participants.some(p => p._id === u._id));
                const isActive = existingConv && activeChat?._id === existingConv._id;
                const initials = u.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';
                return (
                  <button
                    key={u._id}
                    onClick={() => {
                      if (isMe) return;
                      if (existingConv) {
                        setActiveChat(existingConv);
                        setConversations(prev => prev.map(conv => {
                          if (conv._id === existingConv._id) {
                            return { ...conv, unreadCount: 0 };
                          }
                          return conv;
                        }));
                        socket.emit('message_seen', { roomId: existingConv._id });
                      } else {
                        startNewChat(u);
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all flex items-center gap-3',
                      isMe
                        ? 'bg-violet-50 border border-violet-200 cursor-default'
                        : isActive
                          ? 'bg-brand-purple/10 border border-brand-purple/20'
                          : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden',
                        isMe
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 ring-2 ring-violet-400 ring-offset-1'
                          : 'bg-gradient-to-br from-violet-400 to-indigo-500'
                      )}>
                        {getMediaUrl(u.avatar)
                          ? <img src={getMediaUrl(u.avatar)} alt={u.fullName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          : initials
                        }
                      </div>
                      {u.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate flex items-center gap-1.5', isMe ? 'text-violet-700' : isActive ? 'text-brand-purple' : 'text-gray-800')}>
                        {u.fullName}
                        {isMe && (
                          <span className="text-[10px] font-medium bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.designation || u.role || 'Member'}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ———————————————————————————————— */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#e5e5e5] bg-opacity-60 bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />

        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-5 py-3 flex items-center gap-4 relative z-10 shadow-sm">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden">
                  {activeChat.isGroup
                    ? activeChat.name[0]
                    : getMediaUrl(activePartner?.avatar)
                      ? <img src={getMediaUrl(activePartner.avatar)} alt={activePartner.fullName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      : partnerInitials
                  }
                </div>
                {!activeChat.isGroup && activePartner?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 truncate leading-tight">
                  {activeChat.isGroup ? activeChat.name : activePartner?.fullName}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {activeChat.isGroup
                    ? `${activeChat.participants.length} members`
                    : activePartner?.isOnline
                      ? <span className="text-green-500 font-medium">• online</span>
                      : `last seen ${activePartner?.lastSeen ? formatDistanceToNow(new Date(activePartner.lastSeen)) + ' ago' : 'recently'}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <button onClick={() => initiateCall('video')} title="Video Call" className="w-9 h-9 rounded-full hover:bg-purple-50 hover:text-brand-purple flex items-center justify-center transition-colors">
                  <Video size={18} />
                </button>
                <button onClick={() => initiateCall('audio')} title="Audio Call" className="w-9 h-9 rounded-full hover:bg-purple-50 hover:text-brand-purple flex items-center justify-center transition-colors">
                  <Phone size={18} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 relative z-10 scroll-smooth"
            >
              <div className="space-y-1 pb-2">
                {messages.map((msg, idx) => {
                  const isMe = (msg.senderId?._id || msg.senderId) === currentUserId;
                  const prevMsg = messages[idx - 1];
                  const nextMsg = messages[idx + 1];

                  // Date separator
                  const showDateSep = idx === 0 || !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));

                  // Avatar: show for first msg in a sender run
                  const showAvatar = !isMe && (idx === 0 || (prevMsg.senderId?._id || prevMsg.senderId) !== (msg.senderId?._id || msg.senderId));
                  // Show sender name in group chats
                  const showName = !isMe && activeChat?.isGroup && showAvatar;

                  return (
                    <React.Fragment key={msg._id}>
                      {showDateSep && <DateSeparator date={msg.createdAt} />}
                      <div className={cn(
                        'transition-all duration-200',
                        idx > 0 && !showDateSep && !showAvatar && !isMe ? 'mt-0.5' : 'mt-2'
                      )}>
                        <MessageBubble
                          msg={msg}
                          isMe={isMe}
                          showAvatar={showAvatar}
                          showName={showName}
                          currentUserId={currentUserId}
                          token={token}
                          onReply={(m) => setReplyTo(m)}
                          onEdit={editMessage}
                          onDelete={deleteMessage}
                          onReact={reactToMessage}
                          onRetry={retryMessage}
                          onScrollTo={scrollToMessage}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Typing indicator */}
                {isSomeoneTyping && (() => {
                  const typingUserId = typingUsers[activeChat._id];
                  const typingUser = allUsers.find(u => u._id === typingUserId);
                  return <TypingIndicator key="typing" name={typingUser?.fullName} />;
                })()}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Scroll-to-bottom button */}
            {!isAtBottom && (
              <button
                onClick={() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  markReadNow();
                }}
                className="absolute bottom-24 right-6 z-20 bg-white border border-gray-200 rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronDown size={14} />
                {newMsgCount > 0 && (
                  <span className="bg-[#6C48F5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{newMsgCount}</span>
                )}
              </button>
            )}

            {/* Message Input Area */}
            <div className="bg-[#F0F2F5] relative z-10 border-t border-gray-200/60">
              {/* Reply preview strip */}
              {replyTo && <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />}

              {/* Attachment preview */}
              {attachment && <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />}

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

              <div className="flex items-end gap-2 bg-white mx-3 mb-3 rounded-2xl pl-3 pr-1.5 py-1.5 shadow-sm border border-transparent transition-all focus-within:border-[#6C48F5]/30 focus-within:shadow-md">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-[#6C48F5] transition-colors p-2 rounded-full hover:bg-purple-50 mb-0.5 flex-shrink-0"
                  title="Attach file"
                >
                  <Paperclip size={20} strokeWidth={1.5} />
                </button>
                <textarea
                  rows={1}
                  placeholder={`Message ${activePartner?.fullName || (activeChat?.isGroup ? activeChat.name : 'group')}…`}
                  value={messageInput}
                  onChange={handleTyping}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-transparent text-[14px] text-gray-800 outline-none placeholder-gray-400 min-h-[36px] max-h-[120px] py-2 resize-none leading-snug"
                  style={{ height: 'auto' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && !attachment}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all ml-1 flex-shrink-0 mb-0.5',
                    (messageInput.trim() || attachment)
                      ? 'bg-[#6C48F5] hover:bg-purple-700 shadow-md hover:scale-105 active:scale-95'
                      : 'bg-gray-200 cursor-not-allowed text-gray-400'
                  )}
                >
                  <Send size={16} className={(messageInput.trim() || attachment) ? 'ml-0.5' : ''} />
                </button>
              </div>
            </div>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-5">
              <MessageSquare size={36} className="text-brand-purple" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Conversation</h2>
            <p className="text-gray-500 max-w-sm text-sm">Choose a chat from the sidebar or click on a team member to start a new message.</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
              <Lock size={14} /> End-to-end encrypted
            </div>
          </div>
        )}
      </div>

      {/* ———————————————————————————————— */}
      {activeChat && activePartner && (
        <div className="w-60 bg-white border-l border-gray-100 flex-shrink-0 overflow-y-auto">
          {/* Profile Card */}
          <div className="p-5 border-b border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3 overflow-hidden">
              {getMediaUrl(activePartner?.avatar)
                ? <img src={getMediaUrl(activePartner.avatar)} alt={activePartner.fullName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : partnerInitials
              }
            </div>
            <h3 className="text-base font-bold text-gray-900">{activePartner.fullName}</h3>
            <span className={cn('mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize', roleColor(activePartner.role))}>
              {displayRole(activePartner.role)}
            </span>
            {/* Online badge */}
            <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', activePartner.isOnline ? 'text-green-500' : 'text-gray-400')}>
              <span className={cn('w-2 h-2 rounded-full', activePartner.isOnline ? 'bg-green-500' : 'bg-gray-300')} />
              {activePartner.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Info rows */}
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Info</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MoreVertical size={13} className="text-brand-purple" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">Email</p>
                    <p className="text-xs text-gray-700 font-semibold break-all">{activePartner.email || 'â€”'}</p>
                  </div>
                </div>
              </div>
            </div>

            {activePartner.department && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Department</p>
                <div className="px-3 py-2 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{activePartner.department}</p>
                </div>
              </div>
            )}

            {activePartner.designation && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Designation</p>
                <div className="px-3 py-2 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{activePartner.designation}</p>
                </div>
              </div>
            )}

            {activePartner.employeeCode && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employee Code</p>
                <div className="px-3 py-2 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800 font-mono">{activePartner.employeeCode}</p>
                </div>
              </div>
            )}

            {!activePartner.isOnline && activePartner.lastSeen && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last Seen</p>
                <div className="px-3 py-2 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(activePartner.lastSeen))} ago</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Actions</p>
              <div className="space-y-1.5">
                <button onClick={() => initiateCall('audio')} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 hover:bg-purple-50 hover:text-brand-purple rounded-xl text-sm text-gray-700 font-medium transition-colors">
                  <Phone size={14} /> Voice Call
                </button>
                <button onClick={() => initiateCall('video')} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 hover:bg-purple-50 hover:text-brand-purple rounded-xl text-sm text-gray-700 font-medium transition-colors">
                  <Video size={14} /> Video Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* â”€â”€â”€ Calling Overlays â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
    {callState !== 'idle' && (
      <CallScreen
        callState={callState}
        callType={callType}
        partnerInfo={callPartner}
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={handleEndCall}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleSpeaker={handleToggleSpeaker}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isSpeakerOff={isSpeakerOff}
      />
    )}

    <IncomingCallPopup
      incomingCall={incomingCall}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
    />
  </>
  );
}

