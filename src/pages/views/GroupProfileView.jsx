import API_URL, { getMediaUrl } from '../../api';
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Hash, Camera } from 'lucide-react';
import MemberCard from '../../components/profile/MemberCard';
import AvatarStack from '../../components/profile/AvatarStack';

export default function GroupProfileView({ channel, setActiveNav, isAdmin }) {
  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FD]">
        <p className="text-gray-500 mb-4">Group not found.</p>
        <button onClick={() => setActiveNav('Channels')} className="text-brand-purple font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const [isUploading, setIsUploading] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(channel);
  const fileInputRef = useRef(null);

  const initials = currentChannel.name.charAt(0).toUpperCase();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.success) {
        const token = sessionStorage.getItem('token');
        const updateRes = await fetch(`${API_URL}/api/channels/${currentChannel._id || currentChannel.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: uploadData.fileUrl })
        });
        
        const updateData = await updateRes.json();
        if (updateData.success) {
          setCurrentChannel(updateData.channel);
        }
      }
    } catch (err) {
      console.error('Failed to update channel avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 overflow-y-auto bg-[#F8F9FD] p-6 lg:p-10 relative"
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => setActiveNav('Channels')}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-purple transition-colors mb-6 font-semibold"
        >
          <ArrowLeft size={16} /> Back to Channel
        </button>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 p-1 shadow-xl mb-6 rotate-3 group"
          >
            <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center -rotate-3 overflow-hidden border-4 border-white relative">
              {getMediaUrl(currentChannel.avatar) ? (
                <img src={getMediaUrl(currentChannel.avatar)} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-400 to-emerald-600">
                  {initials}
                </span>
              )}
              {isAdmin && (
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploading ? 'opacity-100 cursor-not-allowed' : ''}`}
                >
                  <Camera className="text-white" size={28} />
                </div>
              )}
            </div>
            {isAdmin && (
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
            )}
          </motion.div>

          {isAdmin && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isUploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white'
                }`}
              >
                <Camera size={16} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </motion.div>
          )}

          <motion.h1 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2"
          >
            <Hash className="text-gray-400" size={28} /> {currentChannel.name}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-lg mx-auto"
          >
            {currentChannel.description || currentChannel.desc || 'No description provided.'}
          </motion.p>

          <motion.div 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8"
          >
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl min-w-[120px]">
              <Users size={24} className="text-teal-500 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{currentChannel.members?.length || 0}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Members</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl min-w-[120px]">
              <Calendar size={24} className="text-blue-500 mb-2" />
              <span className="text-lg font-bold text-gray-900 mt-1">
                {new Date(currentChannel.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Created On</span>
            </div>
          </motion.div>

          {/* Members List */}
          {currentChannel.members && currentChannel.members.length > 0 && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-10 text-left border-t border-gray-100 pt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  Members ({currentChannel.members.length})
                </h3>
                <AvatarStack members={currentChannel.members} totalCount={currentChannel.members.length} maxVisible={6} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentChannel.members.map((m, i) => (
                  <MemberCard
                    key={m._id || i}
                    member={typeof m === 'object' ? m : { fullName: m, role: 'Member' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
