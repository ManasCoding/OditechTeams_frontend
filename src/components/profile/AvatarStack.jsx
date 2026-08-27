import React from 'react';
import { getMediaUrl } from '../../api';

export default function AvatarStack({ members = [], totalCount, maxVisible = 6 }) {
  const total = totalCount !== undefined ? totalCount : members.length;
  const visibleMembers = members.slice(0, maxVisible);
  const remaining = total - visibleMembers.length;

  const getInitials = (m) => {
    if (!m) return 'U';
    if (typeof m === 'string') return m.slice(0, 2).toUpperCase();
    if (m.fullName) {
      return m.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2.5">
        {visibleMembers.map((m, i) => {
          const init = getInitials(m);
          const name = typeof m === 'object' ? m.fullName : m;
          const rawAvatar = typeof m === 'object' ? m.avatar : null;
          const avatarUrl = getMediaUrl(rawAvatar);

          return (
            <div
              key={i}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold tracking-tight flex-shrink-0 overflow-hidden hover:scale-110 hover:z-20 transition-transform cursor-pointer"
              title={name}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span>{init}</span>
              )}
            </div>
          );
        })}
      </div>
      {remaining > 0 && (
        <span className="text-xs sm:text-sm font-semibold text-gray-500 ml-2.5 flex-shrink-0">
          +{remaining}
        </span>
      )}
    </div>
  );
}
