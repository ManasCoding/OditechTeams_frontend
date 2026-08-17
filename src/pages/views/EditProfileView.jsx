import API_URL from '../../api';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function EditProfileView({ setActiveNav, loggedInUser }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setFormData({
            fullName: data.user.fullName || '',
            phone: data.user.phone || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, avatar: data.fileUrl }));
      } else {
        setSaveStatus('error');
        setSaveMessage('Avatar upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to upload file', err);
      setSaveStatus('error');
      setSaveMessage('Failed to upload avatar. Is the backend running?');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setSaveMessage('');
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setSaveStatus('error');
        setSaveMessage('You are not logged in. Please log in again.');
        setSaving(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        // Notify Dashboard to fetch fresh user data from DB immediately
        window.dispatchEvent(new Event('userUpdated'));
        // Notify Dashboard to refresh user data immediately
        window.dispatchEvent(new Event('userUpdated'));
        setSaveStatus('success');
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setActiveNav('Profile'), 1000);
      } else {
        setSaveStatus('error');
        setSaveMessage('Failed to save: ' + (data.message || 'Unknown error. HTTP ' + res.status));
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      setSaveStatus('error');
      setSaveMessage('Error saving profile. Is the backend server running on port 5000?');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FD]">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="flex-1 overflow-y-auto bg-[#F8F9FD] p-6 lg:p-10 relative"
    >
      <div className="max-w-2xl mx-auto relative z-10">
        
        <button 
          onClick={() => setActiveNav('Profile')}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-purple transition-colors mb-6 font-semibold"
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>

          {/* Status Banner */}
          {saveStatus === 'success' && (
            <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              <CheckCircle size={16} /> {saveMessage}
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle size={16} /> {saveMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                  {uploadingAvatar ? (
                    <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                  ) : formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {formData.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Avatar Image</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {uploadingAvatar ? 'Uploading...' : 'Upload New Avatar'}
                  </button>
                  {formData.avatar && (
                    <button
                      onClick={() => setFormData({ ...formData, avatar: '' })}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
                rows="4"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
