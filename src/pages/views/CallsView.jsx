import API_URL from '../../api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOff, Search, Video, Clock, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { socket } from '../../socket';
import CallScreen from './CallScreen';
import IncomingCallPopup from './IncomingCallPopup';

const AVATAR_COLORS = [
  'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400',
  'bg-orange-400', 'bg-teal-400', 'bg-indigo-400', 'bg-rose-400',
];

const typeConfig = {
  incoming: { Icon: PhoneIncoming, label: 'Incoming', color: 'text-green-500' },
  outgoing: { Icon: Phone,         label: 'Outgoing', color: 'text-blue-500'  },
  missed:   { Icon: PhoneMissed,   label: 'Missed',   color: 'text-red-500'   },
  ended:    { Icon: Phone,         label: 'Ended',    color: 'text-blue-500'  },
  rejected: { Icon: PhoneOff,      label: 'Rejected', color: 'text-red-500'   },
  ongoing:  { Icon: Phone,         label: 'Ongoing',  color: 'text-green-500' },
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function formatDuration(secs) {
  if (!secs || secs === 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
}

function formatAvgDuration(secs) {
  if (!secs) return '0m';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getCallType(call, currentUserId) {
  if (call.callStatus === 'missed')   return 'missed';
  if (call.callStatus === 'rejected') return 'missed';
  if (call.callStatus === 'ongoing')  return 'incoming';
  const callerId = call.callerId?._id || call.callerId;
  return String(callerId) === String(currentUserId) ? 'outgoing' : 'incoming';
}

export default function CallsView() {
  const [search, setSearch]     = useState('');
  const [calls, setCalls]       = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  // ── Calling State ─────────────────────────────────────────
  const [callState,    setCallState]    = useState('idle');   // idle | calling | ringing | connected | ended
  const [callType,     setCallType]     = useState('audio');  // audio | video
  const [callPartner,  setCallPartner]  = useState(null);
  const [callId,       setCallId]       = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCameraOff,  setIsCameraOff]  = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  const peerRef           = useRef(null);
  const callPartnerIdRef  = useRef(null);
  const callIdRef         = useRef(null);
  const callTypeRef       = useRef(callType);

  useEffect(() => { callTypeRef.current = callType; }, [callType]);

  const currentUser   = JSON.parse(sessionStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id || currentUser.id;
  const token         = sessionStorage.getItem('token');

  // ── WebRTC helpers ─────────────────────────────────────────
  const createPeerConnection = useCallback((partnerId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    callPartnerIdRef.current = partnerId;

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice_candidate', { to: partnerId, candidate: e.candidate });
    };
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') cleanupCall(true);
    };
    return pc;
  }, []);

  const cleanupCall = (showEnded = false) => {
    setLocalStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    setRemoteStream(null);
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    if (showEnded) {
      setTimeout(() => { setCallState('idle'); setCallPartner(null); setIncomingCall(null); setCallId(null); }, 2000);
    } else {
      setCallState('idle'); setCallPartner(null); setIncomingCall(null); setCallId(null);
    }
  };

  // ── Socket setup ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    socket.auth = { token };
    if (!socket.connected) socket.connect();

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
      } catch (err) { console.error('Offer error:', err); cleanupCall(); }
    });

    socket.on('call_rejected', () => { setCallState('ended'); cleanupCall(true); });

    socket.on('offer', async ({ from, offer }) => {
      try {
        const pc = createPeerConnection(from);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callTypeRef.current === 'video' });
        setLocalStream(stream);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
        setCallState('connected');
      } catch (err) { console.error('Offer handle error:', err); cleanupCall(); }
    });

    socket.on('answer', async ({ answer }) => {
      try { if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer)); }
      catch (err) { console.error('Answer error:', err); }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      try { if (peerRef.current && candidate) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (err) { console.error('ICE error:', err); }
    });

    socket.on('call_ended', () => { setCallState('ended'); cleanupCall(true); });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [token, createPeerConnection]);

  // ── Call actions ───────────────────────────────────────────
  const initiateCall = (user, type) => {
    if (!user) return;
    setCallType(type);
    setCallPartner(user);
    setCallState('calling');
    callPartnerIdRef.current = user._id;
    socket.emit('call_user', {
      to: user._id,
      callType: type,
      callerInfo: { fullName: currentUser.fullName, _id: currentUserId }
    }, (response) => {
      if (response?.callId) { setCallId(response.callId); callIdRef.current = response.callId; }
    });
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const { from, callType: ct, callId: cid } = incomingCall;
    setCallType(ct);
    setCallState('connected');
    setCallId(cid);
    callIdRef.current = cid;
    const partner = contacts.find(u => u._id === from) || { fullName: incomingCall.callerInfo?.fullName || 'User', _id: from };
    setCallPartner(partner);
    socket.emit('accept_call', { to: from, callId: cid });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    socket.emit('reject_call', { to: incomingCall.from, callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    socket.emit('end_call', { to: callPartnerIdRef.current, callId: callIdRef.current, duration: 0 });
    setCallState('ended');
    cleanupCall(true);
  };

  // ── Data fetching ──────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true); setError(false);
    try {
      const [callsRes, usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/calls`),
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/stats`),
      ]);
      const callsData = await callsRes.json();
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (callsData.success) setCalls(callsData.calls);
      if (usersData.success) setContacts(usersData.users.filter(u => u._id !== currentUserId));
      if (statsData.success) setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch calls data:', err);
      setError(true);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Helpers ──────────────────────────────────────────────
  const getInitials = (name = '') => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '??';
  const getColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  const filtered = calls.filter(c => {
    const callerName   = c.callerId?.fullName || '';
    const receiverName = c.receiverId?.fullName || '';
    const q = search.toLowerCase();
    return callerName.toLowerCase().includes(q) || receiverName.toLowerCase().includes(q);
  });

  const activeCall = calls.find(c => c.callStatus === 'ongoing') || null;
  const totalCalls  = stats?.totalCallsThisWeek ?? '—';
  const missedCalls = stats?.missedCallsThisWeek ?? '—';
  const avgDur      = stats ? formatAvgDuration(stats.avgDurationSecs) : '—';

  return (
    <>
      {/* ── Incoming Call Popup ────────────────────────────── */}
      {incomingCall && (
        <IncomingCallPopup
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* ── Active Call Screen ─────────────────────────────── */}
      {callState !== 'idle' && callPartner && (
        <CallScreen
          callState={callState}
          callType={callType}
          partnerInfo={callPartner}
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={handleEndCall}
          onToggleMic={() => { localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setIsMuted(m => !m); }}
          onToggleCamera={() => { localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setIsCameraOff(c => !c); }}
          onToggleSpeaker={() => setIsSpeakerOff(s => !s)}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isSpeakerOff={isSpeakerOff}
        />
      )}

      <div className="flex flex-h-full bg-[#F8F9FD] p-6 overflow-y-auto gap-5 flex-1">

        {/* ── Left — Recent Calls ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calls</h2>
              <p className="text-sm text-gray-400 mt-0.5">Voice and video call history</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAll}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
              <button className="flex items-center gap-2 bg-brand-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200">
                <Plus size={16} /> New Call
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total Calls',  value: loading ? '…' : totalCalls,  sub: 'this week', color: 'text-brand-purple', bg: 'bg-purple-50', Icon: Phone       },
              { label: 'Missed Calls', value: loading ? '…' : missedCalls, sub: 'this week', color: 'text-red-500',      bg: 'bg-red-50',    Icon: PhoneMissed },
              { label: 'Avg Duration', value: loading ? '…' : avgDur,      sub: 'per call',  color: 'text-blue-500',     bg: 'bg-blue-50',   Icon: Clock       },
            ].map(({ label, value, sub, color, bg, Icon }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Calls List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Recent Calls</h3>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {loading && <div className="px-5 py-10 text-center text-sm text-gray-400">Loading calls…</div>}

              {!loading && error && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-red-400 mb-3">⚠️ Could not connect to the backend.</p>
                  <button onClick={fetchAll} className="px-4 py-2 bg-brand-purple text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">Retry</button>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  {search ? 'No calls match your search.' : 'No call history yet.'}
                </div>
              )}

              {!loading && !error && filtered.map((call, idx) => {
                const callerId    = call.callerId?._id || call.callerId;
                const isCaller    = String(callerId) === String(currentUserId);
                const otherPerson = isCaller ? call.receiverId : call.callerId;
                const name        = otherPerson?.fullName || 'Unknown';
                const initials    = getInitials(name);
                const color       = getColor(idx);
                const callType    = getCallType(call, currentUserId);
                const tc          = typeConfig[callType] || typeConfig.ended;
                const kind        = call.callType === 'video' ? 'Video' : 'Voice';
                const duration    = formatDuration(call.duration);

                return (
                  <div key={call._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden`}>
                      {otherPerson?.avatar
                        ? <img src={otherPerson.avatar} alt={name} className="w-full h-full object-cover" />
                        : initials
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <tc.Icon size={12} className={tc.color} />
                        <span className={`text-xs font-medium ${callType === 'missed' ? 'text-red-500' : 'text-gray-500'}`}>{tc.label}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{kind}</span>
                      </div>
                    </div>

                    <div className="text-right mr-2">
                      <p className="text-xs text-gray-400">{timeAgo(call.createdAt)}</p>
                      {duration && <p className="text-xs font-medium text-gray-600 mt-0.5">{duration}</p>}
                    </div>

                    {/* ── WORKING Call-back buttons ── */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => initiateCall(otherPerson, 'audio')}
                        className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
                        title="Voice call"
                      >
                        <Phone size={14} />
                      </button>
                      <button
                        onClick={() => initiateCall(otherPerson, 'video')}
                        className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Video call"
                      >
                        <Video size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button className="text-xs font-semibold text-brand-purple hover:underline flex items-center gap-1">
                View full call history <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right — Contacts + Active Call ── */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">

          {/* Contacts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Contacts</h3>
            <div className="space-y-3">
              {loading && <p className="text-xs text-gray-400">Loading…</p>}
              {!loading && contacts.length === 0 && <p className="text-xs text-gray-400">No contacts found.</p>}
              {contacts.slice(0, 8).map((c, i) => {
                const initials = getInitials(c.fullName);
                const color    = getColor(i);
                return (
                  <div key={c._id || i} className="flex items-center gap-3 group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold overflow-hidden`}>
                        {c.avatar
                          ? <img src={c.avatar} alt={c.fullName} className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${c.isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-400 capitalize">{c.role || 'Member'}</p>
                    </div>
                    {/* ── WORKING Call buttons ── */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => initiateCall(c, 'audio')}
                        className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
                        title="Voice Call"
                      >
                        <Phone size={12} />
                      </button>
                      <button
                        onClick={() => initiateCall(c, 'video')}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Video Call"
                      >
                        <Video size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Call Widget */}
          {activeCall ? (
            <div className="bg-gradient-to-br from-brand-purple to-blue-500 rounded-2xl p-5 text-white shadow-lg shadow-purple-200">
              <p className="text-xs font-semibold opacity-70 mb-3 uppercase tracking-wider">On a call</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {activeCall.callerId?.avatar
                    ? <img src={activeCall.callerId.avatar} alt={activeCall.callerId.fullName} className="w-full h-full object-cover" />
                    : getInitials(activeCall.callerId?.fullName || 'U')
                  }
                </div>
                <div>
                  <p className="text-sm font-bold">{activeCall.callerId?.fullName || 'Unknown'}</p>
                  <p className="text-xs opacity-70">
                    {formatDuration(activeCall.duration) || 'Connecting…'} · {activeCall.callType === 'video' ? 'Video' : 'Voice'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                  <Video size={13} /> Video
                </button>
                <button
                  onClick={handleEndCall}
                  className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  <PhoneOff size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-5 text-center border border-gray-100">
              <Phone size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-medium">No active call</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
