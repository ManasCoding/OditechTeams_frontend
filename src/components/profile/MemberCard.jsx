import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { getMediaUrl } from '../../api';

export default function MemberCard({ member, onClick }) {
  const [imgOpen, setImgOpen] = useState(false);

  const fullName = typeof member === 'object' ? member?.fullName : (typeof member === 'string' ? member : 'Member');
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleRaw = typeof member === 'object' ? (member?.role || 'Member') : 'Member';
  const roleDisplay = roleRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const designation = typeof member === 'object' ? (member?.designation || member?.department || member?.bio || 'Team Member') : 'Team Member';
  const isOnline = typeof member === 'object' ? (member?.isOnline ?? true) : true;
  const rawAvatar = typeof member === 'object' ? member?.avatar : null;
  const avatarUrl = getMediaUrl(rawAvatar);

  return (
    <>
      <motion.div
        whileHover={{ y: -1, scale: 1.01 }}
        onClick={onClick}
        className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-gray-100/90 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-purple-100 transition-all group"
      >
        {/* Avatar with Online Dot */}
        <div
          className="relative flex-shrink-0"
          onClick={(e) => {
            if (avatarUrl) {
              e.stopPropagation();
              setImgOpen(true);
            }
          }}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] ring-2 ring-purple-100">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {/* Green Online Dot */}
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              isOnline ? 'bg-[#00c950]' : 'bg-gray-300'
            }`}
          />
          {/* Zoom hint on hover if avatar exists */}
          {avatarUrl && (
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={10} className="text-white" />
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {fullName && (
              <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-brand-purple transition-colors max-w-[90px]">
                {fullName}
              </h4>
            )}
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 bg-[#F0EBFC] text-[#6E3FF3]">
              {roleDisplay}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {designation}
          </p>
        </div>

        {/* Status */}
        <div className="text-right flex-shrink-0">
          <p className={`text-xs font-semibold ${isOnline ? 'text-[#00c950]' : 'text-gray-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
          {!isOnline && member?.lastSeen && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatDistanceToNow(new Date(member.lastSeen))} ago
            </p>
          )}
        </div>
      </motion.div>

      {/* Full-size image preview modal */}
      <AnimatePresence>
        {imgOpen && avatarUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImgOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center gap-3"
            >
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-64 h-64 rounded-3xl object-cover shadow-2xl ring-4 ring-white/20"
              />
              <p className="text-white font-bold text-lg drop-shadow">{fullName}</p>
              <p className="text-white/60 text-sm -mt-1">{roleDisplay}</p>
              <button
                onClick={() => setImgOpen(false)}
                className="mt-1 px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl backdrop-blur-sm transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
