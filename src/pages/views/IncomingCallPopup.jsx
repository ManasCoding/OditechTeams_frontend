import React, { useEffect, useRef } from 'react';
import { getMediaUrl } from '../../api';
import { PhoneCall, PhoneOff, Video } from 'lucide-react';

export default function IncomingCallPopup({ incomingCall, onAccept, onReject }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!incomingCall) return;

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification(`Incoming ${incomingCall.callType} call`, {
        body: `${incomingCall.callerInfo?.fullName || 'Someone'} is calling you...`,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Ringtone — use a reliable data URI beep as fallback
    try {
      // Create a looping beep using Web Audio API
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        let isPlaying = true;

        const playBeep = () => {
          if (!isPlaying) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 480;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
          setTimeout(() => { if (isPlaying) playBeep(); }, 1200);
        };

        playBeep();
        audioRef.current = { stop: () => { isPlaying = false; ctx.close(); } };
      }
    } catch (e) {
      // Audio not available
    }

    return () => {
      if (audioRef.current?.stop) audioRef.current.stop();
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const { callerInfo, callType } = incomingCall;
  const callerName = callerInfo?.fullName || 'Unknown Caller';
  const initials = callerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in-right">
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(139,117,245,0.3)',
        }}
        className="rounded-3xl p-5 w-80 border border-white/10 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">
              Incoming {callType === 'video' ? 'Video' : 'Audio'} Call
            </span>
          </div>
        </div>

        {/* Caller Info */}
        <div className="flex items-center gap-4 mb-5">
          {/* Animated Avatar */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-brand-purple/40 animate-ping scale-125"></div>
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
              {getMediaUrl(callerInfo?.avatar)
                ? <img src={getMediaUrl(callerInfo.avatar)} alt={callerName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : initials
              }
            </div>
          </div>

          <div>
            <p className="text-white font-bold text-base leading-tight">{callerName}</p>
            <p className="text-white/50 text-sm mt-0.5 flex items-center gap-1.5">
              {callType === 'video'
                ? <><Video size={13} /> Video calling...</>
                : <><PhoneCall size={13} /> Audio calling...</>
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Reject */}
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
          >
            <PhoneOff size={18} />
            <span className="text-sm">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
          >
            {callType === 'video' ? <Video size={18} /> : <PhoneCall size={18} />}
            <span className="text-sm">Accept</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
