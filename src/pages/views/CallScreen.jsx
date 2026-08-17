import React, { useEffect, useRef, useState } from 'react';
import {
  PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, PhoneCall
} from 'lucide-react';

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallScreen({
  callState,      // 'calling' | 'ringing' | 'connected' | 'ended'
  callType,       // 'audio' | 'video'
  partnerInfo,    // { fullName, ... }
  localStream,
  remoteStream,
  onEndCall,
  onToggleMic,
  onToggleCamera,
  onToggleSpeaker,
  isMuted,
  isCameraOff,
  isSpeakerOff,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const containerRef = useRef(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer
  useEffect(() => {
    if (callState !== 'connected') return;
    setElapsedSeconds(0);
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const partnerName = partnerInfo?.fullName || 'Unknown';
  const initials = partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const statusLabel = {
    calling: 'Calling...',
    ringing: 'Ringing...',
    connected: formatDuration(elapsedSeconds),
    ended: 'Call Ended',
  }[callState] || '';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-between"
      style={{
        background: callType === 'video' && remoteStream
          ? 'transparent'
          : 'linear-gradient(160deg, #0f0f1a 0%, #1a0a2e 40%, #0f1a2e 100%)',
      }}
    >
      {/* Video Background (remote stream) */}
      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: callState === 'connected' && remoteStream ? 'block' : 'none' }}
        />
      )}

      {/* Dark overlay on video */}
      {callType === 'video' && callState === 'connected' && remoteStream && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* ─── Top Bar ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex items-center justify-between px-6 pt-8">
        <div className="text-white/60 text-sm font-medium flex items-center gap-2">
          {callType === 'video'
            ? <><Video size={14} className="text-brand-purple" /> Video Call</>
            : <><PhoneCall size={14} className="text-brand-purple" /> Voice Call</>
          }
        </div>
        {callType === 'video' && (
          <button
            onClick={toggleFullscreen}
            className="text-white/60 hover:text-white transition-colors p-2"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        )}
      </div>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-5">

        {/* Avatar — shown for audio calls or when video not yet connected */}
        {(callType === 'audio' || callState !== 'connected' || !remoteStream) && (
          <div className="relative">
            {/* Pulsing rings */}
            {(callState === 'calling' || callState === 'ringing') && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-brand-purple/30 animate-ping"
                  style={{ transform: 'scale(1.4)', animationDuration: '1.5s' }}
                />
                <div
                  className="absolute inset-0 rounded-full border border-brand-purple/20 animate-ping"
                  style={{ transform: 'scale(1.8)', animationDuration: '2s', animationDelay: '0.3s' }}
                />
              </>
            )}

            {/* Avatar */}
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #8B75F5 0%, #5b4fd4 50%, #4b8cf7 100%)',
                boxShadow: callState === 'connected'
                  ? '0 0 60px rgba(139,117,245,0.5), 0 20px 60px rgba(0,0,0,0.4)'
                  : '0 0 30px rgba(139,117,245,0.3)',
              }}
            >
              {partnerInfo?.avatar
                ? <img src={partnerInfo.avatar} alt={partnerName} className="w-full h-full object-cover" />
                : initials
              }
            </div>
          </div>
        )}

        {/* Partner Name */}
        <div className="text-center">
          <h2
            className="text-2xl font-bold"
            style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {partnerName}
          </h2>
          <p
            className={`text-base mt-1 font-medium tracking-wide ${
              callState === 'connected'
                ? 'text-green-400'
                : callState === 'ended'
                ? 'text-red-400'
                : 'text-white/60'
            }`}
          >
            {callState === 'calling' && (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">Calling</span>
              </span>
            )}
            {callState !== 'calling' && statusLabel}
          </p>
        </div>
      </div>

      {/* ─── Local Video PiP ───────────────────────────────────── */}
      {callType === 'video' && localStream && callState === 'connected' && (
        <div
          className="absolute top-20 right-5 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
          style={{ width: 120, height: 160 }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff size={24} className="text-white/50" />
            </div>
          )}
        </div>
      )}

      {/* ─── Controls ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-6 pb-12">
        <div className="flex items-center justify-center gap-5">
          {/* Mute Mic */}
          <button
            onClick={onToggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
              isMuted
                ? 'bg-red-500/90 shadow-lg shadow-red-500/30'
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            {isMuted ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-18 h-18 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-2xl"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
              boxShadow: '0 10px 30px rgba(255,65,108,0.5)',
            }}
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          {/* Camera or Speaker */}
          {callType === 'video' ? (
            <button
              onClick={onToggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                isCameraOff
                  ? 'bg-red-500/90 shadow-lg shadow-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              {isCameraOff ? <VideoOff size={22} className="text-white" /> : <Video size={22} className="text-white" />}
            </button>
          ) : (
            <button
              onClick={onToggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                isSpeakerOff
                  ? 'bg-red-500/90 shadow-lg shadow-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              {isSpeakerOff ? <VolumeX size={22} className="text-white" /> : <Volume2 size={22} className="text-white" />}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
