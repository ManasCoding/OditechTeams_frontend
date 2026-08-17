import API_URL from '../../api';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileStats from '../../components/profile/ProfileStats';
import ProfileTabs from '../../components/profile/ProfileTabs';

export default function ProfileView({ loggedInUser, setActiveNav }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FD]">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 overflow-y-auto bg-[#F8F9FD] p-6 lg:p-10 relative"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <ProfileHeader 
          user={userProfile} 
          isOwnProfile={true} 
          onEdit={() => setActiveNav('EditProfile')} 
        />
        <ProfileStats />
        <ProfileTabs user={userProfile} isOwnProfile={true} />
      </div>
    </motion.div>
  );
}
