import API_URL from '../../api';
import React, {
  useState, useEffect, useRef, useMemo, useCallback
} from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, Monitor, Users, MessageSquare,
  Hand, Circle, MoreHorizontal, PhoneOff, Search, X, Send,
  Shield, Maximize2, Minimize2, Layout, User, Wifi, WifiOff,
  MonitorOff, AlertTriangle, RefreshCw, MoreVertical, Pin, UserMinus,
  Check, Volume2, ChevronDown, ChevronUp, Sparkles, Smile, Clock
} from 'lucide-react';
import useWebRTC from '../../hooks/useWebRTC';

/* ─────────────────────────────────────────────────────────────
   Helpers & Color Palette
───────────────────────────────────────────────────────────── */
function makeInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  'linear-gradient(135deg, #14B8A6, #0D9488)',
  'linear-gradient(135deg, #F97316, #EA580C)',
];

function colorForName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTimer(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h.toString().padStart(2, '0')}:${m}:${s}`;
}

/* ─────────────────────────────────────────────────────────────
   Animated speaking soundwaves
───────────────────────────────────────────────────────────── */
function SpeakingWave({ isMuted, isSpeaking }) {
  if (isMuted) {
    return <MicOff size={13} className="text-red-400 flex-shrink-0" />;
  }
  return (
    <div className="flex items-center gap-[2px] h-3 flex-shrink-0">
      <span className="w-[3px] h-2.5 bg-emerald-400 rounded-full animate-pulse" />
      <span className="w-[3px] h-3.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
      <span className="w-[3px] h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Video Tile for Local User (Self)
───────────────────────────────────────────────────────────── */
function LocalVideoTile({ stream, isCameraOff, label = 'You', isMuted, isSpeaking, isPinned, onPin, avatar }) {
  const ref = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const initials = makeInitials(label);
  const bgGrad = colorForName(label);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#161B26] border flex items-end transition-all duration-300 group shadow-lg ${
        isSpeaking ? 'border-[#6C47FF] shadow-[0_0_20px_rgba(108,71,255,0.35)]' : 'border-white/10 hover:border-white/20'
      }`}
      style={{ aspectRatio: '16/10', minHeight: 180 }}
    >
      {/* Fallback Avatar when camera is off */}
      {isCameraOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#121620] to-[#1A2234]">
          {avatar ? (
            <img src={avatar} alt={label} className="w-24 h-24 rounded-full object-cover shadow-2xl border-2 border-white/20" />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border border-white/20"
              style={{ background: bgGrad }}
            >
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Live Video */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)', display: isCameraOff ? 'none' : 'block' }}
      />

      {/* Top-Right 3-Dots Menu */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="w-8 h-8 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        >
          <MoreVertical size={15} />
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-10 w-40 bg-[#1E2538] border border-white/10 rounded-xl shadow-2xl py-1 z-30 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { onPin?.(); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-xs text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <Pin size={13} /> {isPinned ? 'Unpin Video' : 'Pin Video'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom-Left Name & Audio Pill */}
      <div className="relative z-10 m-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
        <SpeakingWave isMuted={isMuted} isSpeaking={isSpeaking} />
        <span className="text-white text-xs font-semibold drop-shadow-md truncate max-w-[160px]">
          {label} (You)
        </span>
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Video Tile for Remote Peer
───────────────────────────────────────────────────────────── */
function RemoteTile({ peerData, isSpeaking, isPinned, onPin, isAdmin, onKick, avatar }) {
  const ref = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (ref.current && peerData.stream) ref.current.srcObject = peerData.stream;
  }, [peerData.stream]);

  const label = peerData.userName || 'Participant';
  const initials = makeInitials(label);
  const bgGrad = colorForName(label);
  const camOff = peerData.isCameraOff || !peerData.stream;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#161B26] border flex items-end transition-all duration-300 group shadow-lg ${
        isSpeaking ? 'border-[#6C47FF] shadow-[0_0_20px_rgba(108,71,255,0.35)]' : 'border-white/10 hover:border-white/20'
      }`}
      style={{ aspectRatio: '16/10', minHeight: 180 }}
    >
      {/* Camera Off Avatar Fallback */}
      {camOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#121620] to-[#1A2234]">
          {avatar ? (
            <img src={avatar} alt={label} className="w-24 h-24 rounded-full object-cover shadow-2xl border-2 border-white/20" />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border border-white/20"
              style={{ background: bgGrad }}
            >
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Live Video */}
      <video
        ref={ref}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: camOff ? 'none' : 'block' }}
      />

      {/* Top-Right 3-Dots Menu & Quick Actions */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="w-8 h-8 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        >
          <MoreVertical size={15} />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-10 w-48 bg-[#1E2538] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { onPin?.(); setShowMenu(false); }}
              className="w-full px-3.5 py-2 text-left text-xs text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
            >
              <Pin size={13} /> {isPinned ? 'Unpin Video' : 'Pin Video'}
            </button>
            {isAdmin && (
              <button
                onClick={() => { onKick?.(); setShowMenu(false); }}
                className="w-full px-3.5 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-medium"
              >
                <UserMinus size={13} /> Remove from Meeting
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom-Left Name & Audio Pill */}
      <div className="relative z-10 m-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
        <SpeakingWave isMuted={peerData.isMuted} isSpeaking={isSpeaking} />
        {peerData.isScreenSharing && <Monitor size={12} className="text-blue-400 flex-shrink-0" />}
        <span className="text-white text-xs font-semibold drop-shadow-md truncate max-w-[160px]">
          {label}
        </span>
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Control Button Component
───────────────────────────────────────────────────────────── */
function CtrlBtn({ icon, label, danger = false, active = false, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : active
          ? 'text-[#8B75F5] hover:bg-[#8B75F5]/10'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
      style={{ minWidth: 64 }}
    >
      <div className="transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className={`text-[11px] font-medium tracking-tight ${
        danger ? 'text-red-400' : active ? 'text-[#8B75F5]' : 'text-white/60 group-hover:text-white'
      }`}>
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Lobby Component
───────────────────────────────────────────────────────────── */
function Lobby({ meetingTitle, localStream, isMuted, isCameraOff, mediaError, onToggleMic, onToggleCam, onJoin, participantCount }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0E14]">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-brand-purple/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[15%] right-[20%] w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80 mb-3">
            <Shield size={13} className="text-emerald-400" /> Oditech Secure Meeting
          </div>
          <h1 className="text-3xl font-bold text-white mb-1.5">{meetingTitle}</h1>
          <p className="text-white/50 text-sm">
            {participantCount > 0 ? `${participantCount} participant${participantCount !== 1 ? 's' : ''} in the room` : 'Ready to join?'}
          </p>
        </div>

        {/* Video Preview */}
        <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden border-2 border-white/10 bg-[#161B26] shadow-2xl">
          {mediaError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-[#111827]">
              <AlertTriangle size={36} className="text-amber-400" />
              <p className="text-white/70 text-sm text-center">{mediaError}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl mt-1 bg-brand-purple hover:bg-purple-700 transition-colors"
              >
                <RefreshCw size={14} /> Retry Permissions
              </button>
            </div>
          ) : (
            <>
              {isCameraOff ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#151924]">
                  <VideoOff size={40} className="text-white/30" />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
              {isMuted && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-red-500/90 shadow-md backdrop-blur-sm">
                  <MicOff size={12} /> Mic Muted
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMic}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${
              isMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            style={{ width: 52, height: 52 }}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button
            onClick={onToggleCam}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${
              isCameraOff ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            style={{ width: 52, height: 52 }}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        </div>

        <button
          onClick={onJoin}
          disabled={!!mediaError || (!localStream && !mediaError)}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all bg-brand-purple hover:bg-[#5B3CE0] shadow-[0_4px_20px_rgba(108,72,245,0.4)] hover:shadow-[0_6px_25px_rgba(108,72,245,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40"
        >
          {(!localStream && !mediaError) ? 'Starting camera...' : 'Join Meeting'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Connecting Screen — shown while socket is connecting
───────────────────────────────────────────────────────────── */
function ConnectingScreen({ onCancel, errorMsg }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0E14]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-brand-purple/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[15%] right-[20%] w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm text-center p-8">
        <div className="w-14 h-14 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide mb-2">Connecting to meeting...</h2>
          {errorMsg ? (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg border border-red-500/30 text-sm mb-3">
              Connection Error: {errorMsg}
            </div>
          ) : timedOut ? (
            <p className="text-white/50 text-sm">
              This is taking longer than expected. Check your internet connection or try refreshing.
            </p>
          ) : (
            <p className="text-white/50 text-sm">Establishing a secure connection</p>
          )}
        </div>
        {(timedOut || errorMsg) && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20"
            >
              <RefreshCw size={14} /> Retry
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Meeting Room Component
───────────────────────────────────────────────────────────── */
export default function MeetingRoom() {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { meetingId: rawMeetingId }  = useParams();
  const meetingId = rawMeetingId ? rawMeetingId.trim() : ''; // Fixes trailing space bugs from copy-pasting URLs

  /* ── Stored user ──────────────────────────────────────────── */
  const storedUser = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  const userName   = storedUser.fullName || storedUser.email?.split('@')[0] || 'You';
  const userId     = storedUser._id || storedUser.id || 'anonymous';
  const userAvatar = storedUser.avatar || null;

  /* ── Meeting data — prefer location.state, else fetch ────── */
  const [meeting,      setMeeting]      = useState(location.state?.meeting || null);
  const [meetingTitle, setMeetingTitle] = useState(location.state?.meeting?.title || 'Oditech Team Meeting');
  const [isUserAdmin,  setIsUserAdmin]  = useState(false);
  const [meetingError, setMeetingError] = useState(null);

  useEffect(() => {
    if (meeting) {
      // We already have meeting data from navigate state — derive admin status
      const admin = Boolean(
        (userId && meeting.hostId === userId) || 
        (userName && meeting.host === userName)
      );
      setIsUserAdmin(admin);
      setMeetingTitle(meeting.title || 'Oditech Team Meeting');
      return;
    }

    // No state — user opened the URL directly (e.g. via copy-link)
    fetch(`${API_URL}/api/meetings/${meetingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMeeting(data.meeting);
          setMeetingTitle(data.meeting.title || 'Oditech Team Meeting');
          const admin = Boolean(
            (userId && data.meeting.hostId === userId) ||
            (userName && data.meeting.host === userName)
          );
          setIsUserAdmin(admin);
        } else {
          setMeetingError('Meeting not found. The link may be invalid or expired.');
        }
      })
      .catch(() => setMeetingError('Could not load meeting details. Check your connection.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  /* ── Show loading / error before rendering the room ──────── */
  if (!meeting && !meetingError) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0E14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-white/50">Loading meeting…</p>
        </div>
      </div>
    );
  }

  if (meetingError) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0E14] text-white">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8">
          <AlertTriangle size={40} className="text-red-400" />
          <h2 className="text-xl font-bold">Meeting Not Found</h2>
          <p className="text-white/60 text-sm">{meetingError}</p>
          <button onClick={() => navigate('/dashboard', { state: { activeView: 'Meetings' } })} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── UI States ────────────────────────────────────────────── */
  const [joined, setJoined] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'speaker'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [toast, setToast] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const [kickTarget, setKickTarget] = useState(null); // { socketId, userName } for kick modal
  const [joinedIds, setJoinedIds] = useState(new Set()); // tracks already-seen peers
  const [joinBanner, setJoinBanner] = useState(null); // { name } short-lived join toast

  const chatEndRef = useRef(null);
  const containerRef = useRef(null);

  /* ── WebRTC Hook ──────────────────────────────────────────── */
  const {
    localStream, peers, isMuted, isCameraOff, isScreenSharing,
    chatMessages, reactions, mediaError, socketConnected,
    status,
    pendingRequests,
    setPendingRequests,
    acceptUser,
    rejectUser,
    requestJoin,
    toggleMic, toggleCam, toggleScreenShare,
    sendChatMessage, raiseHand, kickUser, leaveRoom, participantCount, kickedMessage, mySocketId,
    connectErrorMsg,
  } = useWebRTC(meetingId, userName, userId, joined, isUserAdmin);

  /* ── Lobby local controls ─────────────────────────────────── */
  const [lobbyMuted, setLobbyMuted] = useState(false);
  const [lobbyCamOff, setLobbyCamOff] = useState(false);
  const toggleLobbyMic = () => {
    if (localStream) localStream.getAudioTracks().forEach(t => (t.enabled = lobbyMuted));
    setLobbyMuted(v => !v);
  };
  const toggleLobbyCam = () => {
    if (localStream) localStream.getVideoTracks().forEach(t => (t.enabled = lobbyCamOff));
    setLobbyCamOff(v => !v);
  };

  /* ── Elapsed timer ───────────────────────────────────────── */
  useEffect(() => {
    if (!joined) return;
    const iv = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [joined]);

  /* ── Auto-scroll chat ─────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ── Handle being kicked ─────────────────────────────────── */
  useEffect(() => {
    if (kickedMessage) {
      alert(kickedMessage);
      navigate('/dashboard', { state: { activeView: 'Meetings' } });
    }
  }, [kickedMessage, navigate]);

  /* ── Fullscreen toggle ───────────────────────────────────── */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* ── Leave meeting ───────────────────────────────────────── */
  const handleLeave = () => {
    leaveRoom();
    navigate('/dashboard', { state: { activeView: 'Meetings' } });
  };

  /* ── Send in-meeting chat ─────────────────────────────────── */
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  /* ── Kick user confirm ───────────────────────────────────── */
  const confirmKick = () => {
    if (!kickTarget) return;
    kickUser(kickTarget.socketId);
    setToast({ type: 'ok', msg: `Removed ${kickTarget.userName} from the meeting.` });
    setTimeout(() => setToast(null), 3000);
    setKickTarget(null);
  };

  /* ── Build all participants list ─────────────────────────── */
  const allParticipants = [
    { socketId: mySocketId || 'local', userName, isMuted, isCameraOff, isMe: true, isHost: isUserAdmin, avatar: userAvatar, isNew: false },
    ...[...peers.entries()]
      .filter(([sid]) => sid !== mySocketId)
      .map(([sid, p]) => ({
        socketId: sid,
        userName: p.userName || 'User',
        isMuted: p.isMuted,
        isCameraOff: p.isCameraOff,
        isMe: false,
        isHost: false,
        avatar: null,
        isNew: !joinedIds.has(sid),
      }))
  ];

  /* ── Detect newly joined peers and show banner ─────────── */
  useEffect(() => {
    const currentIds = new Set([...peers.keys()].filter(sid => sid !== mySocketId));
    currentIds.forEach(sid => {
      if (!joinedIds.has(sid)) {
        const peerName = peers.get(sid)?.userName || 'Someone';
        setJoinBanner({ name: peerName });
        setTimeout(() => setJoinBanner(null), 3500);
        setJoinedIds(prev => new Set([...prev, sid]));
        // Open the panel so the user sees the new participant
        setPanelOpen(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peers]);

  const filteredParticipants = allParticipants.filter(p =>
    p.userName.toLowerCase().includes(partSearch.toLowerCase())
  );

  /* ── Dynamic Grid Calculation ────────────────────────────── */
  const peersArray = [...peers.entries()].filter(([sid]) => sid !== mySocketId);
  const totalTiles = 1 + peersArray.length; // Self + Remotes

  const getGridColsClass = () => {
    if (totalTiles <= 1) return 'grid-cols-1 max-w-3xl mx-auto';
    if (totalTiles <= 6) return 'grid-cols-1 sm:grid-cols-2';
    if (totalTiles <= 9) return 'grid-cols-1 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';
  };

  /* ─────────────────────────────────────────────────────────
     LOBBY
  ───────────────────────────────────────────────────────── */
  if (!joined) {
    return (
      <Lobby
        meetingTitle={meetingTitle}
        localStream={localStream}
        isMuted={lobbyMuted}
        isCameraOff={lobbyCamOff}
        mediaError={mediaError}
        onToggleMic={toggleLobbyMic}
        onToggleCam={toggleLobbyCam}
        onJoin={() => {
          setJoined(true);
        }}
        participantCount={totalTiles}
      />
    );
  }

  /* ─────────────────────────────────────────────────────────
     WAITING FOR SOCKET CONNECTION
  ───────────────────────────────────────────────────────── */
  if (status === 'idle') {
    return <ConnectingScreen errorMsg={connectErrorMsg} onCancel={() => navigate('/dashboard', { state: { activeView: 'Meetings' } })} />;
  }

  /* ─────────────────────────────────────────────────────────
     WAITING FOR APPROVAL
  ───────────────────────────────────────────────────────── */
  if (status === 'pending') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0E14]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-brand-purple/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[15%] right-[20%] w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md p-8 bg-[#161B26] border border-white/10 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#1A2234] flex items-center justify-center animate-pulse">
            <Clock size={28} className="text-white/50" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Waiting for host approval</h2>
            <p className="text-white/60 text-sm">Your request to join the meeting has been sent. Please wait while the host lets you in.</p>
          </div>
          <button onClick={() => navigate('/dashboard', { state: { activeView: 'Meetings' } })} className="mt-4 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80 hover:text-white transition-colors">
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────
     REJECTED
  ───────────────────────────────────────────────────────── */
  if (status === 'rejected') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0E14]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md p-8 bg-[#161B26] border border-white/10 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <Shield size={28} className="text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Join request declined</h2>
            <p className="text-white/60 text-sm">The host did not approve your request to join this meeting.</p>
          </div>
          <button onClick={() => navigate('/dashboard', { state: { activeView: 'Meetings' } })} className="mt-4 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80 hover:text-white transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // From here on, status is 'accepted' or user is admin.

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col bg-[#0B0E14] text-white select-none overflow-hidden font-sans"
    >
      {/* ── JOIN REQUEST POPUP ───────────────────────────────── */}
      {isUserAdmin && pendingRequests && pendingRequests.length > 0 && (
        <div className="absolute top-20 right-6 z-[100] bg-[#1E2538] border border-white/10 rounded-xl shadow-2xl p-4 w-[340px] flex flex-col gap-3" style={{ animation: 'participantSlideIn 0.3s ease' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users size={18} className="text-brand-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white mb-0.5">Someone wants to join</h4>
              <p className="text-xs text-white/70 truncate">{pendingRequests[0].userName}</p>
            </div>
            {pendingRequests.length > 1 && (
              <span className="bg-brand-purple text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                +{pendingRequests.length - 1} more
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => acceptUser(pendingRequests[0].socketId)}
              className="flex-1 bg-brand-purple hover:bg-purple-600 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg shadow-purple-500/20"
            >
              Admit
            </button>
            <button
              onClick={() => rejectUser(pendingRequests[0].socketId)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors border border-white/10"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <header className="h-14 px-5 bg-[#0F131C] border-b border-white/10 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left Info */}
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[220px] sm:max-w-md">
            {meetingTitle}
          </h2>
          <div className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg text-xs font-mono text-white/70 tracking-wider">
            {formatTimer(elapsed)}
          </div>
          <div className="flex items-center text-emerald-400" title="Secure End-to-End Meeting">
            <Shield size={15} />
          </div>
        </div>

        {/* Center / Right View Controls */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(v => v === 'gallery' ? 'speaker' : 'gallery')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors"
          >
            {viewMode === 'gallery' ? <Layout size={14} /> : <User size={14} />}
            <span>{viewMode === 'gallery' ? 'Speaker View' : 'Gallery View'}</span>
          </button>

          {/* Participant count button */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              panelOpen ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span className="text-xs font-bold">{allParticipants.length}</span>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE AREA ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── VIDEO TILES GRID AREA ───────────────────────────── */}
        <main className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto min-w-0">
          <div className="flex-1 flex items-center justify-center">
            {viewMode === 'gallery' ? (
              <div className={`w-full grid gap-3.5 content-center ${getGridColsClass()}`}>
                {/* Local Video Tile */}
                <LocalVideoTile
                  stream={localStream}
                  isCameraOff={isCameraOff}
                  label={userName}
                  isMuted={isMuted}
                  isSpeaking={false}
                  isPinned={pinnedId === 'local'}
                  onPin={() => setPinnedId(p => p === 'local' ? null : 'local')}
                  avatar={userAvatar}
                />

                {/* Remote Video Tiles */}
                {peersArray.map(([sid, pData]) => (
                  <RemoteTile
                    key={sid}
                    peerData={pData}
                    isSpeaking={false}
                    isPinned={pinnedId === sid}
                    onPin={() => setPinnedId(p => p === sid ? null : sid)}
                    isAdmin={isUserAdmin}
                    onKick={() => setKickTarget({ socketId: sid, userName: pData.userName || 'Participant' })}
                  />
                ))}
              </div>
            ) : (
              /* Speaker View */
              <div className="w-full h-full flex flex-col gap-3">
                <div className="flex-1 min-h-0">
                  {peersArray.length > 0 ? (
                    <RemoteTile
                      peerData={peersArray[0][1]}
                      isSpeaking={true}
                      isAdmin={isUserAdmin}
                      onKick={() => setKickTarget({ socketId: peersArray[0][0], userName: peersArray[0][1].userName })}
                    />
                  ) : (
                    <LocalVideoTile
                      stream={localStream}
                      isCameraOff={isCameraOff}
                      label={userName}
                      isMuted={isMuted}
                      isSpeaking={false}
                      avatar={userAvatar}
                    />
                  )}
                </div>
                {/* Thumbnails row */}
                {peersArray.length > 0 && (
                  <div className="h-28 flex gap-3 overflow-x-auto pb-1 flex-shrink-0">
                    <div className="w-44 flex-shrink-0">
                      <LocalVideoTile
                        stream={localStream}
                        isCameraOff={isCameraOff}
                        label={userName}
                        isMuted={isMuted}
                        avatar={userAvatar}
                      />
                    </div>
                    {peersArray.slice(1).map(([sid, pData]) => (
                      <div key={sid} className="w-44 flex-shrink-0">
                        <RemoteTile
                          peerData={pData}
                          isAdmin={isUserAdmin}
                          onKick={() => setKickTarget({ socketId: sid, userName: pData.userName })}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR (Participants & In-Meeting Chat) ──── */}
        {panelOpen && (
          <aside className="w-80 lg:w-88 bg-[#0F131C] border-l border-white/10 flex flex-col flex-shrink-0 z-20 overflow-hidden">
            {/* Participants Section */}
            <div className="flex flex-col flex-1 min-h-[45%] max-h-[55%] border-b border-white/10 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Participants ({allParticipants.length})
                  </h3>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Join Banner — slides in when a new user enters */}
              <div
                style={{
                  maxHeight: joinBanner ? 40 : 0,
                  opacity: joinBanner ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease, opacity 0.3s ease',
                }}
              >
                {joinBanner && (
                  <div className="mx-4 my-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="text-[11px] text-emerald-300 font-semibold truncate">
                      {joinBanner.name} joined the meeting
                    </span>
                  </div>
                )}
              </div>

              {/* Pending Requests Section (Admin only) */}
              {isUserAdmin && pendingRequests && pendingRequests.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2 border-b border-white/5 bg-[#1A2234]/50">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                    Requests to join <span className="bg-brand-purple text-white px-1.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                  </h4>
                  {pendingRequests.map(req => (
                    <div key={req.socketId} className="flex flex-col gap-2 bg-[#161B26] p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-white text-[10px] font-bold">
                          {makeInitials(req.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate leading-tight">
                            {req.userName}
                          </p>
                          <p className="text-[10px] text-white/50">Requesting to join</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptUser(req.socketId)}
                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors rounded-lg py-1.5 text-xs font-semibold"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          onClick={() => rejectUser(req.socketId)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded-lg py-1.5 text-xs font-semibold"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="px-4 py-2 mt-1 mb-2">
                <div className="flex items-center gap-2 bg-[#1A2234]/60 border border-white/5 rounded-xl px-3 py-2.5">
                  <Search size={14} className="text-white/40" />
                  <input
                    type="text"
                    placeholder="Search participants"
                    value={partSearch}
                    onChange={e => setPartSearch(e.target.value)}
                    className="bg-transparent text-[13px] text-white placeholder-white/40 outline-none w-full"
                  />
                </div>
              </div>

              {/* Participants list */}
              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 custom-scrollbar">
                {filteredParticipants.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-xs">
                    <Users size={20} className="mx-auto mb-1.5 opacity-40" />
                    No participants found
                  </div>
                )}
                {filteredParticipants.map((p, idx) => (
                  <div
                    key={p.socketId}
                    className="flex items-center gap-3 px-3 py-2 group"
                    style={{
                      animation: p.isNew ? 'participantSlideIn 0.4s ease forwards' : undefined,
                      animationDelay: p.isNew ? `${idx * 40}ms` : undefined,
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
                        style={{ background: p.avatar ? 'transparent' : colorForName(p.userName) }}
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.userName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          makeInitials(p.userName)
                        )}
                      </div>
                    </div>

                    {/* Name & Role Tag */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[13px] font-semibold text-white truncate leading-tight">
                        {p.userName}{p.isMe ? <span className="text-white font-normal"> (You)</span> : ''}
                      </p>
                      {p.isHost && (
                        <p className="text-[11px] font-semibold text-emerald-400 leading-tight mt-0.5">
                          Host
                        </p>
                      )}
                    </div>

                    {/* Status Icons */}
                    <div className="flex items-center gap-3 flex-shrink-0 mr-2">
                      {p.isMuted ? (
                        <MicOff size={16} className="text-red-500" />
                      ) : (
                        <Mic size={16} className="text-emerald-500" />
                      )}
                      {p.isCameraOff ? (
                        <VideoOff size={16} className="text-white/50" />
                      ) : (
                        <Video size={16} className="text-white/50" />
                      )}

                      {/* Admin Kick Button */}
                      {isUserAdmin && !p.isMe && (
                        <button
                          onClick={() => setKickTarget({ socketId: p.socketId, userName: p.userName })}
                          className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ml-0.5"
                          title="Remove user from meeting"
                        >
                          <UserMinus size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Meeting Chat Section */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0B0E14]">
              {/* Chat Header */}
              <div
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Chat</h3>
                  {chatMessages.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-purple text-white">
                      {chatMessages.length}
                    </span>
                  )}
                </div>
                {chatCollapsed ? <ChevronDown size={14} className="text-white/50" /> : <ChevronUp size={14} className="text-white/50" />}
              </div>

              {/* Chat Message List */}
              {!chatCollapsed && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8 text-white/30 text-xs">
                        <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                        No messages yet.<br />Send a message to the group.
                      </div>
                    )}
                    {chatMessages.map(msg => {
                      const isMe = msg.userName === userName;
                      return (
                        <div key={msg.id} className="flex gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm"
                            style={{ background: colorForName(msg.userName) }}
                          >
                            {makeInitials(msg.userName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-semibold text-white/90 truncate">
                                {msg.userName} {isMe ? '(You)' : ''}
                              </span>
                              <span className="text-[10px] text-white/40">{msg.time}</span>
                            </div>
                            <div className="bg-[#1C2230] border border-white/5 text-white/90 text-xs px-3.5 py-2 rounded-2xl rounded-tl-none inline-block max-w-full break-words">
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#0F131C]">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-brand-purple transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="w-8 h-8 rounded-full bg-brand-purple hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-brand-purple text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
                    >
                      <Send size={13} className="ml-0.5" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── FLOATING BOTTOM CONTROLS DOCK ─────────────────────── */}
      <footer className="p-3 bg-[#0F131C] border-t border-white/10 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mute / Unmute */}
          <CtrlBtn
            icon={isMuted ? <MicOff size={19} /> : <Mic size={19} />}
            label={isMuted ? 'Unmute' : 'Mute'}
            danger={isMuted}
            onClick={toggleMic}
          />

          {/* Video Toggle */}
          <CtrlBtn
            icon={isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
            label={isCameraOff ? 'Start Video' : 'Stop Video'}
            danger={isCameraOff}
            onClick={toggleCam}
          />

          {/* Screen Share */}
          <CtrlBtn
            icon={isScreenSharing ? <MonitorOff size={19} /> : <Monitor size={19} />}
            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            active={isScreenSharing}
            onClick={toggleScreenShare}
          />

          {/* Participants */}
          <CtrlBtn
            icon={<Users size={19} />}
            label="Participants"
            active={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
          />

          {/* In-Meeting Chat */}
          <CtrlBtn
            icon={<MessageSquare size={19} />}
            label="Chat"
            active={panelOpen && !chatCollapsed}
            onClick={() => {
              setPanelOpen(true);
              setChatCollapsed(false);
            }}
          />

          {/* Raise Hand */}
          <CtrlBtn
            icon={<Hand size={19} />}
            label="Raise Hand"
            onClick={raiseHand}
          />

          {/* Record */}
          <CtrlBtn
            icon={<Circle size={19} className="text-red-400" />}
            label="Record"
            onClick={() => {
              setToast({ type: 'info', msg: 'Cloud recording started.' });
              setTimeout(() => setToast(null), 2500);
            }}
          />

          {/* More options menu */}
          <div className="relative">
            <CtrlBtn
              icon={<MoreHorizontal size={19} />}
              label="More"
              onClick={() => setShowMore(!showMore)}
            />
            {showMore && (
              <div className="absolute bottom-16 left-0 rounded-2xl bg-[#1E2538] border border-white/10 shadow-2xl p-1.5 z-50 w-52 backdrop-blur-xl">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setToast({ type: 'ok', msg: 'Meeting link copied to clipboard!' });
                    setTimeout(() => setToast(null), 2500);
                    setShowMore(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-400" /> Copy Meeting Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Leave Meeting Button */}
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold bg-[#EF4444] hover:bg-[#DC2626] shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-95 flex-shrink-0"
        >
          <PhoneOff size={16} />
          <span>Leave Meeting</span>
        </button>
      </footer>

      {/* ── KICK PARTICIPANT CONFIRMATION MODAL (ADMIN ONLY) ──── */}
      {kickTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#181E2E] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <UserMinus size={24} />
            </div>
            <h3 className="text-base font-bold text-white text-center mb-1">
              Remove Participant?
            </h3>
            <p className="text-xs text-white/60 text-center mb-6">
              Are you sure you want to remove <span className="font-semibold text-white">{kickTarget.userName}</span> from this meeting?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setKickTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmKick}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg transition-colors"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION OVERLAY ────────────────────────── */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-semibold text-white z-50 bg-[#1E2538] border border-white/10 shadow-2xl backdrop-blur-md flex items-center gap-2">
          {toast.type === 'ok' ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── REACTIONS OVERLAY ─────────────────────────────────── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
        {reactions.map(r => (
          <div
            key={r.id}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#6C47FF]/90 backdrop-blur-md border border-white/20 shadow-xl"
          >
            <span>{r.emoji}</span>
            <span>{r.userName} raised their hand</span>
          </div>
        ))}
      </div>

      {showMore && <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />}
    </div>
  );
}
