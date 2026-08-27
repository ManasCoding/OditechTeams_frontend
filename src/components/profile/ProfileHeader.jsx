import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building, Briefcase, Mail, Phone, Calendar } from 'lucide-react';
import { getMediaUrl } from '../../api';

export default function ProfileHeader({ user, isOwnProfile, onEdit }) {
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleDisplay = (user?.role || 'member').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const avatarUrl = getMediaUrl(user?.avatar);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-purple/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative group"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-purple to-blue-600 p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={user?.fullName} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-brand-purple to-blue-600">
                  {initials}
                </span>
              )}
            </div>
          </div>
          {/* Status Indicator */}
          <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </motion.div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <motion.h1 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-3"
              >
                {user?.fullName || 'Loading...'}
                <span className="text-sm px-3 py-1 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">
                  {roleDisplay}
                </span>
              </motion.h1>
              <p className="text-gray-500 font-medium mt-1">@{user?.email?.split('@')[0] || user?.employeeCode}</p>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <motion.button 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                onClick={onEdit}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Edit Profile
              </motion.button>
            )}
          </div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 mt-6"
          >
            {user?.department && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Building size={16} className="text-brand-purple" />
                <span>{user.department}</span>
              </div>
            )}
            {user?.designation && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Briefcase size={16} className="text-brand-purple" />
                <span>{user.designation}</span>
              </div>
            )}
            {user?.email && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail size={16} className="text-brand-purple" />
                <span>{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone size={16} className="text-brand-purple" />
                <span>{user.phone}</span>
              </div>
            )}
            {user?.createdAt && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Calendar size={16} className="text-brand-purple" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
