import API_URL, { getMediaUrl } from '../../api';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, Edit3, Calendar, FileText, Users, UserCheck, 
  Globe, Eye, Clock, Languages, Bell, Copy, Check, Share2, Trash2, 
  Download, Image as ImageIcon, ChevronRight, Plus, MoreVertical, ShieldCheck,
  X, Upload
} from 'lucide-react';

export default function GroupProfileView({ channel, setActiveNav, isAdmin }) {
  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FD] p-6">
        <p className="text-gray-500 mb-4">Group not found.</p>
        <button onClick={() => setActiveNav('Channels')} className="text-brand-purple font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const [currentChannel, setCurrentChannel] = useState(channel);
  const [allUsersMap, setAllUsersMap] = useState({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch populated channel & all users lookup map on mount
  useEffect(() => {
    const channelId = channel._id || channel.id;
    if (channelId) {
      fetch(`${API_URL}/api/channels/${channelId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.channel) {
            setCurrentChannel(data.channel);
          }
        })
        .catch(err => console.error('Failed to fetch single channel:', err));
    }

    fetch(`${API_URL}/api/users`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
          const map = {};
          data.users.forEach(u => {
            map[String(u._id || u.id)] = u;
          });
          setAllUsersMap(map);
        }
      })
      .catch(err => console.error('Failed to fetch users:', err));
  }, [channel?._id, channel?.id]);

  // Group Info state for edit
  const [editName, setEditName] = useState(currentChannel.name || '');
  const [editDesc, setEditDesc] = useState(currentChannel.description || currentChannel.desc || '');

  // Toggles State for Group Settings
  const [settings, setSettings] = useState({
    whoCanAddMembers: 'Only Admins',
    whoCanPost: 'All Members',
    memberApproval: true,
    allowMemberInvite: true,
    showGroupInfo: true,
    allowFileSharing: true,
  });

  // Toggles State for Notifications
  const [notifications, setNotifications] = useState({
    allActivity: true,
    newMembers: true,
    memberPosts: true,
    mentions: true,
    filesDocs: true,
    emailDigest: 'Daily',
  });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const groupHandle = `# ${currentChannel.name?.toLowerCase().replace(/\s+/g, '') || 'group'}`;
  const groupId = `GRP-2026-${(currentChannel._id || '0002').slice(-4).toUpperCase()}`;
  const formattedDate = new Date(currentChannel.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });

  const groupLink = `${window.location.origin}/group/${currentChannel.name?.toLowerCase().replace(/\s+/g, '') || 'group'}`;

  const rawMembersList = currentChannel.members || [];
  
  // Resolve member object from map if string ID
  const resolveMember = (m) => {
    if (typeof m === 'object' && m?.fullName) return m;
    const id = typeof m === 'object' ? (m._id || m.id) : m;
    const found = allUsersMap[String(id)];
    if (found) return found;
    return { fullName: 'Member', role: 'Member', designation: 'Team Member' };
  };

  const resolvedMembers = rawMembersList.map(resolveMember);
  const adminsCount = resolvedMembers.filter(m => 
    ['admin', 'super_admin', 'Admin', 'Super Admin'].includes(m.role)
  ).length || 1;

  // Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
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
      setIsUploadingAvatar(false);
    }
  };

  // Handle Cover Photo Upload
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
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
          body: JSON.stringify({ coverPhoto: uploadData.fileUrl })
        });
        
        const updateData = await updateRes.json();
        if (updateData.success) {
          setCurrentChannel(updateData.channel);
        }
      }
    } catch (err) {
      console.error('Failed to update channel cover:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle Edit Group Info Save
  const handleSaveInfo = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const updateRes = await fetch(`${API_URL}/api/channels/${currentChannel._id || currentChannel.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, description: editDesc })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        setCurrentChannel(updateData.channel);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update group info:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(groupLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FD] p-6 lg:p-8 font-sans">
      
      {/* Top Back Header */}
      <button 
        onClick={() => setActiveNav('Channels')}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-purple transition-colors mb-6 font-semibold text-sm"
      >
        <ArrowLeft size={16} /> Back to Channel
      </button>

      {/* Main Grid Container */}
      <div className="space-y-6">

        {/* ── ROW 1: 3 Columns (Avatar & Cover, Group Information, About This Group) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD 1: Group Avatar & Cover */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Group Avatar & Cover</h3>
            
            {/* Cover Banner + Overlay Avatar */}
            <div className="relative">
              {/* Cover Photo */}
              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] shadow-inner">
                {currentChannel.coverPhoto ? (
                  <img src={getMediaUrl(currentChannel.coverPhoto)} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                )}
                {/* Cover Edit Pencil Badge */}
                {isAdmin && (
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-all hover:scale-105"
                    title="Change Cover Photo"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>

              {/* Avatar Box (overlapping bottom-left) */}
              <div className="absolute -bottom-4 left-4 w-16 h-16 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                {getMediaUrl(currentChannel.avatar) ? (
                  <img src={getMediaUrl(currentChannel.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                    {currentChannel.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Avatar Edit Badge */}
                {isAdmin && (
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-xs hover:bg-gray-50"
                    title="Change Avatar"
                  >
                    <Edit3 size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

            {/* Upload Button */}
            <div className="mt-8">
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="w-full py-2 px-3 border border-dashed border-purple-300 rounded-xl text-brand-purple hover:bg-purple-50 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload size={14} />
                {isUploadingAvatar ? 'Uploading...' : 'Upload New Avatar'}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-1.5">
                Recommended: 500x500px (JPG, PNG)
              </p>
            </div>
          </div>

          {/* CARD 2: Group Information */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Group Information</h3>
              {isAdmin && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1 text-xs border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-3.5 flex-1 text-xs">
              <div className="flex items-center">
                <span className="w-28 text-gray-400 font-medium">Group Name</span>
                <span className="font-bold text-gray-900">{currentChannel.name}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-gray-400 font-medium">Group Handle</span>
                <span className="font-bold text-gray-900">{groupHandle}</span>
              </div>
              <div className="flex items-start">
                <span className="w-28 text-gray-400 font-medium pt-0.5">Description</span>
                <span className="font-medium text-gray-700 flex-1">{currentChannel.description || currentChannel.desc || 'nothing'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-gray-400 font-medium">Created On</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Calendar size={13} className="text-gray-400" /> {formattedDate}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-gray-400 font-medium">Group ID</span>
                <span className="font-bold text-gray-900 font-mono flex items-center gap-1">
                  <FileText size={13} className="text-gray-400" /> {groupId}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: About This Group */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 mb-4">About This Group</h3>

            <div className="space-y-3 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Users size={14} className="text-gray-400" /> Members
                </span>
                <span className="font-bold text-gray-900">{resolvedMembers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <ShieldCheck size={14} className="text-gray-400" /> Admins
                </span>
                <span className="font-bold text-gray-900">{adminsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" /> Created On
                </span>
                <span className="font-bold text-gray-900">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Globe size={14} className="text-gray-400" /> Group Type
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                  Private
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Eye size={14} className="text-gray-400" /> Visibility
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                  Visible
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Languages size={14} className="text-gray-400" /> Language
                </span>
                <span className="font-bold text-gray-900">English</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" /> Time Zone
                </span>
                <span className="font-bold text-gray-900 text-[11px]">(GMT+05:30) Asia/Kolkata</span>
              </div>
            </div>
          </div>

        </div>


        {/* ── ROW 2: 3 Columns (Group Settings, Notifications, Actions & Group Link) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD 4: Group Settings */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Group Settings</h3>

            <div className="space-y-4 flex-1 text-xs">
              {/* Setting Option 1 */}
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50/80 p-1 rounded-lg">
                <span className="text-gray-700 font-semibold flex items-center gap-2">
                  <Users size={14} className="text-gray-400" /> Who can add members
                </span>
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  Only Admins <ChevronRight size={13} />
                </span>
              </div>

              {/* Setting Option 2 */}
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50/80 p-1 rounded-lg">
                <span className="text-gray-700 font-semibold flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" /> Who can post
                </span>
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  All Members <ChevronRight size={13} />
                </span>
              </div>

              {/* Toggle Option 1 */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-gray-800 font-semibold">Member approval required</p>
                  <p className="text-[11px] text-gray-400">New members need admin approval</p>
                </div>
                <button 
                  onClick={() => toggleSetting('memberApproval')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.memberApproval ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.memberApproval ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle Option 2 */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-gray-800 font-semibold">Allow member to invite others</p>
                  <p className="text-[11px] text-gray-400">Members can invite new users</p>
                </div>
                <button 
                  onClick={() => toggleSetting('allowMemberInvite')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.allowMemberInvite ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.allowMemberInvite ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle Option 3 */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-gray-800 font-semibold">Show group info to non-members</p>
                  <p className="text-[11px] text-gray-400">Group will be visible in search</p>
                </div>
                <button 
                  onClick={() => toggleSetting('showGroupInfo')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.showGroupInfo ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.showGroupInfo ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle Option 4 */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-gray-800 font-semibold">Allow file sharing</p>
                  <p className="text-[11px] text-gray-400">Members can upload and share files</p>
                </div>
                <button 
                  onClick={() => toggleSetting('allowFileSharing')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.allowFileSharing ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.allowFileSharing ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* CARD 5: Notifications */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Notifications</h3>

            <div className="space-y-4 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">All Group Activity</p>
                  <p className="text-[11px] text-gray-400">New posts, updates, etc.</p>
                </div>
                <button 
                  onClick={() => toggleNotification('allActivity')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notifications.allActivity ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.allActivity ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">New Members</p>
                  <p className="text-[11px] text-gray-400">When someone joins</p>
                </div>
                <button 
                  onClick={() => toggleNotification('newMembers')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notifications.newMembers ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.newMembers ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">Member Posts</p>
                  <p className="text-[11px] text-gray-400">Posts and replies</p>
                </div>
                <button 
                  onClick={() => toggleNotification('memberPosts')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notifications.memberPosts ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.memberPosts ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">Mentions</p>
                  <p className="text-[11px] text-gray-400">When someone mentions you</p>
                </div>
                <button 
                  onClick={() => toggleNotification('mentions')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notifications.mentions ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.mentions ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">Files & Documents</p>
                  <p className="text-[11px] text-gray-400">New files and documents</p>
                </div>
                <button 
                  onClick={() => toggleNotification('filesDocs')}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    notifications.filesDocs ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.filesDocs ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-700 font-semibold">Email Digest</span>
                <select 
                  value={notifications.emailDigest}
                  onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.value })}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium outline-none cursor-pointer"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Off</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARD 6: Actions & Group Link */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 text-purple-600 bg-purple-50/40 hover:bg-purple-100 transition-colors flex items-center gap-2"
                >
                  <Edit3 size={14} /> Update Group Info
                </button>
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50/40 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <ImageIcon size={14} /> Change Group Avatar
                </button>
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50/40 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <ImageIcon size={14} /> Change Cover Photo
                </button>
                <button 
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50/40 hover:bg-amber-100 transition-colors flex items-center gap-2"
                >
                  <Download size={14} /> Export Group Data
                </button>
                <button 
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50/40 hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Group
                </button>
              </div>
            </div>

            {/* Group Link Section */}
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-900 mb-0.5">Group Link</h4>
              <p className="text-[11px] text-gray-400 mb-2">Share this link to invite others</p>
              
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 mb-2">
                <input 
                  type="text" 
                  readOnly 
                  value={groupLink} 
                  className="bg-transparent text-xs text-gray-600 outline-none w-full truncate font-mono"
                />
                <button 
                  onClick={handleCopyLink} 
                  className="p-1 text-gray-400 hover:text-brand-purple transition-colors flex-shrink-0"
                  title="Copy link"
                >
                  {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>

              <button 
                onClick={handleCopyLink}
                className="w-full py-2 bg-brand-purple hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-200"
              >
                <Share2 size={13} /> {copiedLink ? 'Link Copied!' : 'Share Group Link'}
              </button>
            </div>
          </div>

        </div>


        {/* ── ROW 3: Members Section (Bottom Row) ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">
              Members ({resolvedMembers.length})
            </h3>
            {isAdmin && (
              <button 
                onClick={() => setActiveNav('Channels')}
                className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-brand-purple bg-purple-50/50 hover:bg-brand-purple hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus size={14} /> Add Members
              </button>
            )}
          </div>

          {/* Members Grid (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedMembers.map((m, i) => {
              const name = m.fullName || 'Member';
              const roleRaw = m.role || 'Member';
              const roleDisplay = roleRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const designation = m.designation || m.department || 'Team Member';
              const avatarUrl = m.avatar || null;
              const isOnline = m.isOnline ?? false;
              const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

              return (
                <div 
                  key={m._id || i}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3 hover:border-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-gray-100 shadow-xs">
                        {getMediaUrl(avatarUrl) ? (
                          <img src={getMediaUrl(avatarUrl)} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          roleRaw === 'super_admin' || roleRaw === 'Super Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : roleRaw === 'admin' || roleRaw === 'Admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {roleDisplay}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{designation}</p>
                    </div>
                  </div>

                  {/* Status & Menu */}
                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <p className={`text-xs font-semibold ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </p>
                      {!isOnline && (
                        <p className="text-[10px] text-gray-400 mt-0.5">7 minutes ago</p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                      <MoreVertical size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Edit Group Info Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Update Group Information</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Group Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-brand-purple text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Description</label>
                <textarea 
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-brand-purple text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveInfo}
                  className="px-4 py-2 rounded-xl bg-brand-purple text-white font-semibold hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
