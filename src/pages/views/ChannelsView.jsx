import React, { useState, useEffect, useRef } from 'react';
import { Hash, Search, Plus, Send, Smile, Paperclip, AtSign, Bold, Pin, Users, FileText, X, Upload, Trash2, UserMinus } from 'lucide-react';
import { socket } from '../../socket';
import AvatarStack from '../../components/profile/AvatarStack';

const initialChannels = [
  { id: 1, name: 'general', desc: 'Company-wide updates', unread: 0 },
  { id: 2, name: 'design-team', desc: 'Design discussions', unread: 3 },
  { id: 3, name: 'development', desc: 'Development updates', unread: 0 },
  { id: 4, name: 'project-x', desc: 'Project X discussions', unread: 1 },
  { id: 5, name: 'marketing', desc: 'Marketing campaigns', unread: 0 },
  { id: 6, name: 'random', desc: 'Random conversations', unread: 5 },
  { id: 7, name: 'hr', desc: 'HR announcements', unread: 0 },
];

const messages = {
  1: [
    { id: 1, author: 'Aman Singh', time: '10:30 AM', text: 'Good morning everyone! 🌟', initials: 'AS', color: 'bg-blue-400', reactions: [] },
    { id: 2, author: 'Priya Sharma', time: '10:32 AM', text: "Hi team! Don't forget about the meeting at 11 AM.", initials: 'PS', color: 'bg-pink-400', reactions: ['🔥 4', '❤️ 2'] },
    { id: 3, author: 'Rohit Verma', time: '10:35 AM', text: "Here's the project update file.", initials: 'RV', color: 'bg-green-400', attachment: { name: 'project-update.pdf', size: '2.4 MB' }, reactions: [] },
    { id: 4, author: 'Neha Patel', time: '10:40 AM', text: 'Thanks for the update! Looks great. 👏', initials: 'NP', color: 'bg-purple-400', reactions: [] },
  ],
  2: [
    { id: 1, author: 'Priya Sharma', time: '9:00 AM', text: 'New design mockups are ready for review!', initials: 'PS', color: 'bg-pink-400', reactions: ['👍 3'] },
    { id: 2, author: 'Vikram Mehta', time: '9:15 AM', text: 'Looks amazing! Great work everyone.', initials: 'VM', color: 'bg-orange-400', reactions: [] },
  ],
  3: [
    { id: 1, author: 'Rohit Verma', time: '8:30 AM', text: 'Deployed the new API endpoints to staging.', initials: 'RV', color: 'bg-green-400', reactions: ['🚀 2'] },
    { id: 2, author: 'Aman Singh', time: '8:45 AM', text: 'Testing in progress. Will update shortly.', initials: 'AS', color: 'bg-blue-400', reactions: [] },
  ],
  4: [{ id: 1, author: 'Aman Singh', time: '11:00 AM', text: 'Project X kickoff meeting scheduled for Friday.', initials: 'AS', color: 'bg-blue-400', reactions: [] }],
  5: [{ id: 1, author: 'Neha Patel', time: '10:00 AM', text: 'New campaign assets uploaded. Check the Files tab!', initials: 'NP', color: 'bg-purple-400', reactions: [] }],
  6: [{ id: 1, author: 'Vikram Mehta', time: '9:50 AM', text: 'Anyone up for lunch today? 🍕', initials: 'VM', color: 'bg-orange-400', reactions: ['😋 5'] }],
  7: [{ id: 1, author: 'HR Team', time: '9:00 AM', text: 'Reminder: Performance reviews start next Monday.', initials: 'HR', color: 'bg-red-400', reactions: [] }],
};

const channelInfo = {
  members: ['AS', 'PS', 'RV', 'NP', 'VM', 'MK'],
  pinned: [
    { author: 'Aman Singh', text: 'Project kickoff on Monday' },
    { author: 'Rohit Verma', text: 'Design system updated' },
  ],
  files: [
    { name: 'Project Guidelines.pdf', size: '2.4 MB', color: 'text-red-500' },
    { name: 'Brand Assets.zip', size: '15.0 MB', color: 'text-blue-500' },
  ],
};

export default function ChannelsView({ isAdmin, loggedInUser, setActiveNav, setSelectedMemberId, setSelectedGroupId, setSelectedChannel }) {
  const [channelList, setChannelList] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelAvatar, setNewChannelAvatar] = useState(null);

  // Add User modal state
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [addUserStatus, setAddUserStatus] = useState(''); // 'success' | 'error' | ''

  // Fetch all users when the Add User modal opens
  useEffect(() => {
    if (isAddUserModalOpen) {
      setUserSearch('');
      setSelectedUser(null);
      setAddUserStatus('');
      fetch('http://localhost:5000/api/users')
        .then(r => r.json())
        .then(data => { if (data.success) setAllUsers(data.users); })
        .catch(err => console.error('Failed to fetch users:', err));
    }
  }, [isAddUserModalOpen]);

  const filteredUsers = allUsers.filter(u =>
    (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!selectedUser || !activeChannel) return;
    setAddUserStatus('');
    try {
      const res = await fetch(`http://localhost:5000/api/channels/${activeChannel}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id })
      });
      const data = await res.json();
      if (data.success) {
        setAddUserStatus('success');
        setSelectedUser(null);
        setUserSearch('');
        fetchChannels(); // refresh members
        setTimeout(() => setIsAddUserModalOpen(false), 1000);
      } else {
        setAddUserStatus(data.message || 'error');
      }
    } catch (err) {
      setAddUserStatus('Failed to add user.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeChannel) return;
    if (!window.confirm('Remove this member from the channel?')) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/groups/${activeChannel}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchChannels();
      else alert(data.message || 'Failed to remove member.');
    } catch (err) {
      console.error('Remove member error:', err);
    }
  };

  const handleDeleteChannel = async () => {
    if (!activeChannel) return;
    const ch = channelList.find(c => (c._id || c.id) === activeChannel);
    if (!window.confirm(`Delete channel "${ch?.name}"? This cannot be undone.`)) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/channels/${activeChannel}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const remaining = channelList.filter(c => (c._id || c.id) !== activeChannel);
        setChannelList(remaining);
        setActiveChannel(remaining.length > 0 ? (remaining[0]._id || remaining[0].id) : null);
        setChannelMessages([]);
      } else {
        alert(data.message || 'Failed to delete channel.');
      }
    } catch (err) {
      console.error('Delete channel error:', err);
    }
  };

  const [channelMessages, setChannelMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  useEffect(() => {
    fetchChannels();
  }, []);

  const activeChannelRef = useRef(activeChannel);
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token && !socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    const handleReceive = (msg) => {
      if (activeChannelRef.current && msg.channelId === activeChannelRef.current) {
        setChannelMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    
    socket.on('receive_channel_message', handleReceive);
    
    return () => {
      socket.off('receive_channel_message', handleReceive);
    };
  }, []);

  useEffect(() => {
    if (activeChannel) {
      socket.emit('join_room', activeChannel);
      fetchMessages(activeChannel);

      return () => {
        socket.emit('leave_room', activeChannel);
      };
    }
  }, [activeChannel]);

  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:5000/api/channels/${channelId}/messages`);
      const data = await res.json();
      if (data.success) {
        setChannelMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/channels');
      const data = await res.json();
      if (data.success) {
        setChannelList(data.channels);
        if (data.channels.length > 0 && !activeChannel) {
          setActiveChannel(data.channels[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      let avatarUrl = '';
      if (newChannelAvatar) {
        const formData = new FormData();
        formData.append('file', newChannelAvatar);
        const uploadRes = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          avatarUrl = uploadData.fileUrl;
        }
      }

      const res = await fetch('http://localhost:5000/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChannelName.trim(), description: newChannelDesc.trim(), avatar: avatarUrl })
      });
      const data = await res.json();
      if (data.success) {
        setChannelList([...channelList, data.channel]);
        setActiveChannel(data.channel._id);
        setIsCreateChannelModalOpen(false);
        setNewChannelName('');
        setNewChannelDesc('');
        setNewChannelAvatar(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error creating channel', error);
    }
  };

  const ch = channelList.find(c => (c._id || c.id) === activeChannel);
  const filtered = channelList.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel) return;
    const name = loggedInUser?.fullName || loggedInUser?.email?.split('@')[0] || 'You';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatar = loggedInUser?.avatar || '';
    const senderId = loggedInUser?._id || null;

    try {
      const res = await fetch(`http://localhost:5000/api/channels/${activeChannel}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: messageInput.trim(), 
          author: name, 
          authorInitials: initials,
          authorAvatar: avatar,
          senderId: senderId
        })
      });
      const data = await res.json();
      if (data.success) {
        setChannelMessages(prev => {
          if (prev.find(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        setMessageInput('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex h-full bg-[#F8F9FD]">
      {/* Channel List */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Channels</h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {filtered.map(c => (
            <button
              key={c._id || c.id}
              onClick={() => setActiveChannel(c._id || c.id)}
              className={`w-full text-left px-3 py-3 rounded-xl mb-0.5 transition-all ${
                activeChannel === (c._id || c.id)
                  ? 'bg-brand-purple/10 border border-brand-purple/20'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {c.avatar ? (
                  <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-200/50">
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-sm border ${
                    activeChannel === (c._id || c.id) 
                      ? 'bg-brand-purple text-white border-brand-purple' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 border-gray-200'
                  }`}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`text-sm font-semibold ${activeChannel === (c._id || c.id) ? 'text-brand-purple' : 'text-gray-700'}`}>
                  {c.name}
                </span>
                {c.unread > 0 && (
                  <span className="ml-auto bg-brand-purple text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {c.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 ml-5">{c.description || c.desc}</p>
            </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand-purple font-semibold hover:bg-purple-50 rounded-xl mt-1 transition-colors"
            >
              <Plus size={15} /> Add Channel
            </button>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
          {ch?.avatar ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-200/50">
              <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-sm">
              {ch?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">{ch?.name}</h3>
            <p className="text-xs text-gray-400">{ch?.description || ch?.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                title="Add User"
              >
                <Users size={15} />
              </button>
            )}
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><Search size={15} /></button>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><Pin size={15} /></button>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><FileText size={15} /></button>
            {isAdmin && (
              <button
                onClick={handleDeleteChannel}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                title="Delete Channel"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F0F2F5] relative">
          {loadingMessages && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm z-10">
              <p className="text-sm text-brand-purple font-semibold bg-white px-4 py-2 rounded-full shadow-sm">Loading messages...</p>
            </div>
          )}
          {!loadingMessages && channelMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-brand-purple overflow-hidden shadow-md border border-gray-200/50">
                {ch?.avatar ? (
                  <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl">
                    {ch?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-gray-900 font-bold mb-1">Welcome to #{ch?.name}</p>
              <p className="text-sm text-gray-500">This is the start of the #{ch?.name} channel.</p>
            </div>
          )}
          
          {channelMessages.map((msg, index) => {
            const currentUserName = loggedInUser?.fullName || loggedInUser?.email?.split('@')[0] || 'You';
            const isMine = msg.author === currentUserName;
            
            const colors = ['bg-blue-400','bg-pink-400','bg-green-400','bg-teal-500','bg-orange-400'];
            const colorIdx = (msg.authorInitials || '??').charCodeAt(0) % colors.length;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Resolve author profile image
            const memberObj = ch?.members?.find(m => 
              typeof m === 'object' && (
                (m._id && msg.senderId && ((m._id === (msg.senderId?._id || msg.senderId)))) ||
                (m.fullName && m.fullName.toLowerCase() === (msg.author || '').toLowerCase())
              )
            );
            const authorAvatar = msg.authorAvatar || (typeof msg.senderId === 'object' ? msg.senderId?.avatar : null) || memberObj?.avatar || null;
            const authorInitials = msg.authorInitials || (msg.author ? msg.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??');

            // Check if previous message was from the same author to group them
            const prevMsg = index > 0 ? channelMessages[index - 1] : null;
            const isFirstInGroup = !prevMsg || prevMsg.author !== msg.author;
            
            return (
              <div key={msg._id} className={`flex gap-2.5 w-full ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                
                {/* Avatar for others (only show on first message of group) */}
                {!isMine && (
                  <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                    {isFirstInGroup && (
                      <div className={`w-8 h-8 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-[10px] font-bold shadow-sm overflow-hidden border border-white/60`}>
                        {authorAvatar ? (
                          <img src={authorAvatar} alt={msg.author} className="w-full h-full object-cover" />
                        ) : (
                          authorInitials
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[75%] lg:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
                  {isFirstInGroup && !isMine && (
                    <span className="text-xs font-semibold text-gray-600 mb-1 ml-1">{msg.author}</span>
                  )}
                  
                  <div className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
                    isMine 
                      ? 'bg-brand-purple text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.text}
                    
                    {/* Timestamp inline inside bubble */}
                    <span className={`inline-block text-[10px] ml-3 float-right translate-y-1 ${isMine ? 'text-purple-200' : 'text-gray-400'}`}>
                      {timeStr}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="bg-[#F0F2F5] p-3 border-t border-gray-200/60">
          {isAdmin || ch?.members?.some(m => (m._id || m) === loggedInUser?._id) ? (
            <div className="flex items-end gap-2 bg-white rounded-3xl pl-4 pr-1.5 py-1.5 shadow-sm border border-transparent transition-all focus-within:border-brand-purple/30 focus-within:shadow-md">
              
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 mb-0.5">
                <Smile size={22} strokeWidth={1.5} />
              </button>
              
              <input
                type="text"
                placeholder={`Message #${ch?.name || 'channel'}`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400 min-h-[40px] py-2"
              />
              
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 mb-0.5 hidden sm:block">
                <Paperclip size={20} strokeWidth={1.5} />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ml-1 flex-shrink-0 mb-0.5 ${
                  messageInput.trim() 
                    ? 'bg-brand-purple hover:bg-purple-700 shadow-md hover:scale-105 active:scale-95' 
                    : 'bg-gray-200 cursor-not-allowed text-gray-400'
                }`}
              >
                <Send size={18} className={messageInput.trim() ? 'ml-0.5' : ''} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white rounded-xl py-3 border border-gray-200 text-sm text-gray-500 font-medium">
              Only members added by an admin can send messages in this group.
            </div>
          )}
        </div>
      </div>

      {/* Channel Info Panel */}
      <div className="w-60 bg-white border-l border-gray-100 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Channel info</h3>
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mt-2">
            {ch?.avatar ? (
              <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-200/50">
                <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-[9px]">
                {ch?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {ch?.name}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{ch?.description || ch?.desc}</p>
        </div>

        {/* Group Profile Link */}
        <div 
          onClick={() => {
            setSelectedChannel(ch);
            setActiveNav('GroupProfile');
          }}
          className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
            {ch?.avatar ? <img src={ch.avatar} alt="Avatar" className="w-full h-full object-cover" /> : ch?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors">Group Profile</h4>
            <p className="text-xs text-gray-500">View details & stats</p>
          </div>
        </div>

        {/* Members */}
        <div className="p-4 border-b border-gray-100">
          {(() => {
            const members = ch?.members || [];
            const total = members.length;
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-800">
                    Members ({total})
                  </h4>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="text-brand-purple hover:text-purple-700 flex items-center gap-1 font-bold text-xs transition-colors"
                      title="Add Member"
                    >
                      <Plus size={14} strokeWidth={2.5} /> <span className="tracking-wide">ADD</span>
                    </button>
                  )}
                </div>
                {total === 0 ? (
                  <p className="text-xs text-gray-400 italic">No members yet</p>
                ) : (
                  <div className="pt-1">
                    <AvatarStack members={members} totalCount={total} maxVisible={6} />
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Pinned Messages */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Pinned Messages</h4>
          <div className="space-y-2">
            {channelInfo.pinned.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{p.author.slice(0, 2)}</div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-800">{p.author}</p>
                  <p className="text-[11px] text-gray-500">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Files */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Files</h4>
          <div className="space-y-2">
            {channelInfo.files.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <FileText size={16} className={f.color} />
                <div>
                  <p className="text-[11px] font-semibold text-gray-800">{f.name}</p>
                  <p className="text-[10px] text-gray-400">{f.size}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-brand-purple font-semibold hover:underline">View all files</button>
        </div>
      </div>

      {/* Create Channel Modal */}
      {isCreateChannelModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Channel</h3>
              <button onClick={() => setIsCreateChannelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Channel Name</label>
                <input 
                  type="text" 
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. project-updates" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label>
                <input 
                  type="text" 
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Profile Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                    {newChannelAvatar ? (
                      <img src={URL.createObjectURL(newChannelAvatar)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} className="text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewChannelAvatar(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <button onClick={handleCreateChannel} className="w-full bg-brand-purple text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-purple-700 transition-colors mt-2">
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User to Channel Modal */}
      {isAddUserModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add User to #{ch?.name}</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Search User</label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-sm"
                />
              </div>

              {/* User List */}
              <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selectedUser?._id === u._id
                          ? 'bg-brand-purple/10'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-xs font-bold flex-shrink-0">
                        {(u.fullName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {selectedUser?._id === u._id && (
                        <span className="text-brand-purple text-xs font-semibold">Selected</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Status Message */}
              {addUserStatus && (
                <p className={`text-sm font-medium text-center ${
                  addUserStatus === 'success' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {addUserStatus === 'success' ? '✅ User added successfully!' : addUserStatus}
                </p>
              )}

              {/* Action Button */}
              <button
                onClick={handleAddUser}
                disabled={!selectedUser}
                className={`w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2 ${
                  selectedUser
                    ? 'bg-brand-purple hover:bg-purple-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {selectedUser ? `Add ${selectedUser.fullName} to Channel` : 'Select a user first'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
