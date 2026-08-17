import API_URL from '../../../../../../../../../api';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Phone, Video } from 'lucide-react';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileStats from '../../components/profile/ProfileStats';
import ProfileTabs from '../../components/profile/ProfileTabs';
import AdminActions from '../../components/profile/AdminActions';

export default function MemberProfileView({ memberId, groupId, setActiveNav, isAdmin }) {
  const [memberProfile, setMemberProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!memberId || !groupId) return;
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/groups/${groupId}/members/${memberId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMemberProfile(data.member);
        }
      } catch (err) {
        console.error('Failed to fetch member profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberProfile();
  }, [memberId, groupId]);

  const handleRemove = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveNav('Channels'); // Navigate back after removing
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FD]">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!memberProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FD]">
        <p className="text-gray-500 mb-4">Member not found.</p>
        <button onClick={() => setActiveNav('Channels')} className="text-brand-purple font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex-1 overflow-y-auto bg-[#F8F9FD] p-6 lg:p-10 relative"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <button 
          onClick={() => setActiveNav('Channels')}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-purple transition-colors mb-6 font-semibold"
        >
          <ArrowLeft size={16} /> Back to Channel
        </button>

        <ProfileHeader 
          user={memberProfile} 
          isOwnProfile={false} 
        />
        
        {/* Action Buttons specific to Member Profile */}
        <div className="flex justify-center md:justify-end gap-3 mt-4">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5">
            <MessageSquare size={16} /> Message
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">
            <Phone size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">
            <Video size={16} />
          </button>
        </div>

        <ProfileStats />
        <ProfileTabs user={memberProfile} isOwnProfile={false} />

        {isAdmin && (
          <AdminActions 
            member={memberProfile} 
            onRemove={handleRemove}
            onPromote={() => console.log('Make admin')}
            onDemote={() => console.log('Remove admin')}
          />
        )}
      </div>
    </motion.div>
  );
}
