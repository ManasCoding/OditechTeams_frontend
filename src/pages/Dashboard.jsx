import API_URL from '../../../../../../../../api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, Hash, MessageSquare, Video, Phone, Calendar,
  Users, CheckSquare, Folder, Grid, Settings, UserCog,
  Search, Bell, ChevronDown, ChevronRight, LogOut,
  Building2, ShieldCheck, Activity, User
} from 'lucide-react';
import ChannelsView from './views/ChannelsView';
import ChatView from './views/ChatView';
import MembersView from './views/MembersView';
import FilesView from './views/FilesView';
import CalendarView from './views/CalendarView';
import UserManagementView from './views/UserManagementView';
import SystemMonitoringView from './views/SystemMonitoringView';
import RoleManagementView from './views/RoleManagementView';
import MeetingsView from './views/MeetingsView';
import CallsView from './views/CallsView';
import TasksView from './views/TasksView';
import ProfileView from './views/ProfileView';
import EditProfileView from './views/EditProfileView';
import MemberProfileView from './views/MemberProfileView';
import GroupProfileView from './views/GroupProfileView';

const teamActivityData = [
  { day: 'Mon', Messages: 40, Meetings: 10 },
  { day: 'Tue', Messages: 65, Meetings: 22 },
  { day: 'Wed', Messages: 55, Meetings: 18 },
  { day: 'Thu', Messages: 75, Meetings: 30 },
  { day: 'Fri', Messages: 90, Meetings: 40 },
  { day: 'Sat', Messages: 80, Meetings: 35 },
  { day: 'Sun', Messages: 60, Meetings: 38 },
];

const recentActivity = [
  { id: 1, name: 'Priya Sharma', action: 'sent a message in #design-team', time: '2m ago', initials: 'PS', color: 'bg-pink-400' },
  { id: 2, name: 'Rohit Verma', action: 'uploaded a file in #project-x', time: '15m ago', initials: 'RV', color: 'bg-blue-400' },
  { id: 3, name: 'Aman Singh', action: 'started a meeting', time: '45m ago', initials: 'AS', color: 'bg-green-400' },
  { id: 4, name: 'Neha Patel', action: 'joined the workspace', time: '1h ago', initials: 'NP', color: 'bg-purple-400' },
];

// Static fallback data
const upcomingMeetings = [
  { id: 1, title: 'Design Review Meeting', time: 'Today, 11:00 AM', color: 'bg-blue-100 text-blue-600' },
  { id: 2, title: 'Project X Standup', time: 'Tomorrow, 10:00 AM', color: 'bg-green-100 text-green-600' },
];

const myTasks = [
  { id: 1, title: 'UI/UX Design for Landing Page', due: 'Due in 2 days', done: false },
  { id: 2, title: 'Fix Authentication Bug', due: 'Due tomorrow', done: false },
];

const getNavItems = (isAdmin) => [
  { section: null, items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true }] },
  {
    section: 'COMMUNICATION',
    items: [
      { label: 'Channels', icon: Hash },
      { label: 'Chat', icon: MessageSquare },
      { label: 'Meetings', icon: Video },
      { label: 'Calls', icon: Phone },
      { label: 'Calendar', icon: Calendar },
    ]
  },
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Members', icon: Users },
      { label: 'Departments', icon: Building2 },
      { label: 'Files', icon: Folder },
      { label: 'Tasks', icon: CheckSquare },
      { label: 'Apps', icon: Grid },
    ]
  },
  ...(isAdmin ? [{
    section: 'ADMIN',
    items: [
      { label: 'User Management', icon: User },
      { label: 'Role Management', icon: ShieldCheck },
      { label: 'System Monitoring', icon: Activity },
      { label: 'Settings', icon: Settings },
    ]
  }] : [
    {
      section: 'SETTINGS',
      items: [
        { label: 'Workspace Settings', icon: Settings },
        { label: 'Profile Settings', icon: UserCog },
      ]
    }
  ])
];

const StatCard = ({ title, value, change, icon: Icon, iconBg }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-green-500 font-medium mt-1">{change}</p>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
      <Icon size={22} className="text-brand-purple" />
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  // Initial fast load from location.state if available
  const [loggedInUser, setLoggedInUser] = useState(location.state?.user || {});

  // Fetch fresh user data from database
  const fetchUserFromDB = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setLoggedInUser(data.user);
        // Optionally keep location.state updated
        if (location.state) {
          location.state.user = data.user;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user from DB:', err);
    }
  };

  // Fetch on mount and listen for profile updates
  useEffect(() => {
    fetchUserFromDB();
    window.addEventListener('userUpdated', fetchUserFromDB);
    return () => window.removeEventListener('userUpdated', fetchUserFromDB);
  }, []);

  // isAdmin: from location.state, or from stored user role
  const isAdmin = location.state?.isAdmin 
    || ['admin', 'super_admin', 'Admin', 'Super Admin'].includes(loggedInUser.role);

  const navItems = getNavItems(isAdmin);
  const [activeNav, setActiveNavRaw] = useState(location.state?.activeView || 'Dashboard');

  // Re-fetch when view changes just to be safe
  const setActiveNav = (view) => {
    fetchUserFromDB();
    setActiveNavRaw(view);
  };

  const [tasks, setTasks] = useState(myTasks);

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Real data state
  const [stats, setStats] = useState({ 
    totalMembers: '-', newThisWeek: 0, 
    activeChannels: '-', newChannelsThisWeek: 0,
    totalMessages: '-', messagesThisWeek: 0,
    totalMeetings: '-', meetingsThisWeek: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch real stats and recent users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch(`${API_URL}/api/stats`),
          fetch(`${API_URL}/api/users/recent`)
        ]);
        const statsData = await statsRes.json();
        const recentData = await recentRes.json();

        if (statsData.success) {
          setStats({
            totalMembers: statsData.totalMembers,
            newThisWeek: statsData.newThisWeek,
            activeChannels: statsData.activeChannels,
            newChannelsThisWeek: statsData.newChannelsThisWeek,
            totalMessages: statsData.totalMessages,
            messagesThisWeek: statsData.messagesThisWeek,
            totalMeetings: statsData.totalMeetings,
            meetingsThisWeek: statsData.meetingsThisWeek
          });
        }

        if (recentData.success) {
          const colors = ['bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
          const activities = recentData.users.map((u, i) => {
            const parts = (u.fullName || 'User').split(' ');
            const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
            const timeAgo = getTimeAgo(new Date(u.createdAt));
            return {
              id: u._id,
              name: u.fullName || 'Unknown',
              action: `joined as ${u.role || 'Member'} in ${u.department || 'the workspace'}`,
              time: timeAgo,
              initials,
              avatar: u.avatar || '',
              color: colors[i % colors.length]
            };
          });
          setRecentActivity(activities);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchData();
  }, []);

  // Helper: format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Build display name and initials from logged in user
  const displayName = loggedInUser.fullName || loggedInUser.email?.split('@')[0] || 'User';
  const rawRole = loggedInUser.role || (isAdmin ? 'Admin' : 'Member');
  // Capitalize role: "super_admin" → "Super Admin", "admin" → "Admin"
  const displayRole = rawRole
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="flex h-screen bg-[#F8F9FD] font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <svg width="32" height="26" viewBox="0 0 60 50" fill="none">
            <circle cx="16" cy="16" r="6" fill="#8B75F5" />
            <path d="M4 40C4 33.3726 9.37258 28 16 28H18C24.6274 28 30 33.3726 30 40V45H4V40Z" fill="#8B75F5" />
            <circle cx="44" cy="16" r="6" fill="#6C48F5" />
            <path d="M30 40C30 33.3726 35.3726 28 42 28H44C50.6274 28 56 33.3726 56 40V45H30V40Z" fill="#6C48F5" />
            <rect x="22" y="8" width="16" height="36" rx="8" fill="#3582FB" stroke="white" strokeWidth="2.5" />
            <circle cx="30" cy="17" r="3.5" fill="white" />
            <path d="M25.5 35C25.5 31.6863 27.8137 29 30 29C32.1863 29 34.5 31.6863 34.5 35V39H25.5V35Z" fill="white" />
          </svg>
          <span className="font-bold text-[15px] text-gray-900">
            Oditech<span className="text-brand-purple">Teams</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((group, gi) => (
            <div key={gi} className="mb-3">
              {group.section && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                  {group.section}
                </p>
              )}
              {group.items.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  onClick={() => setActiveNav(label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeNav === label
                      ? 'bg-brand-purple text-white shadow-md shadow-purple-200'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="p-3 border-t border-gray-100">
          <div 
            onClick={() => setActiveNav('Profile')}
            className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {loggedInUser.avatar
                ? <img src={loggedInUser.avatar} alt={displayName} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 leading-tight break-words" title={displayName}>{displayName}</p>
              <p className="text-[10px] text-brand-purple font-medium capitalize">{displayRole}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-sm text-gray-500">
              {activeNav === 'Dashboard' ? `Welcome back, ${firstName}! 👋` :
               activeNav === 'Channels' ? 'Browse and join team channels' :
               activeNav === 'Chat' ? 'Direct messages with your team' :
               activeNav === 'Members' ? 'Manage your workspace members' :
               activeNav === 'Files' ? 'All shared files in one place' :
               activeNav === 'Calendar' ? 'Your schedule and upcoming events' :
               activeNav === 'Meetings' ? 'Schedule and join video meetings' :
               activeNav === 'Calls' ? 'Voice and video call history' :
               activeNav === 'User Management' ? 'Manage all users, roles and access levels' :
               activeNav === 'System Monitoring' ? 'Real-time server health and performance metrics' :
               activeNav === 'Role Management' ? 'Define roles and assign permissions to users' :
               activeNav === 'Tasks' ? 'Track and manage your team\'s tasks across projects' :
               activeNav === 'Settings' ? 'Configure your workspace settings' :
               activeNav}
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-64">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search (Ctrl + K)"
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>

          {/* Icons */}
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Calendar size={16} />
          </button>
          <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div 
            onClick={() => setActiveNav('Profile')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
              {loggedInUser.avatar ? (
                <img src={loggedInUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{displayRole}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>

          <button
            onClick={() => {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('user');
              navigate('/');
            }}
            className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Scrollable body — renders view or dashboard content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeNav === 'Channels' && <ChannelsView isAdmin={isAdmin} loggedInUser={loggedInUser} setActiveNav={setActiveNav} setSelectedMemberId={setSelectedMemberId} setSelectedGroupId={setSelectedGroupId} setSelectedChannel={setSelectedChannel} />}
          {activeNav === 'Chat' && <ChatView />}
          {activeNav === 'Meetings' && <MeetingsView isAdmin={isAdmin} />}
          {activeNav === 'Calls' && <CallsView />}
          {activeNav === 'Members' && <MembersView />}
          {activeNav === 'Files' && <FilesView />}
          {activeNav === 'Calendar' && <CalendarView />}
          {activeNav === 'User Management' && <UserManagementView isAdmin={isAdmin} />}
          {activeNav === 'System Monitoring' && <SystemMonitoringView />}
          {activeNav === 'Role Management' && <RoleManagementView />}
          {activeNav === 'Tasks' && <TasksView />}
          {activeNav === 'Profile' && <ProfileView loggedInUser={loggedInUser} setActiveNav={setActiveNav} />}
          {activeNav === 'EditProfile' && <EditProfileView loggedInUser={loggedInUser} setActiveNav={setActiveNav} />}
          {activeNav === 'MemberProfile' && <MemberProfileView memberId={selectedMemberId} groupId={selectedGroupId} setActiveNav={setActiveNav} isAdmin={isAdmin} />}
          {activeNav === 'GroupProfile' && <GroupProfileView channel={selectedChannel} setActiveNav={setActiveNav} isAdmin={isAdmin} />}
          {!['Channels','Chat','Meetings','Calls','Members','Files','Calendar','User Management','System Monitoring','Role Management','Tasks','Profile','EditProfile','MemberProfile','GroupProfile'].includes(activeNav) && (
          <div className="flex-1 overflow-y-auto p-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Members"
              value={loadingStats ? '…' : stats.totalMembers.toLocaleString()}
              change={loadingStats ? '' : `+ ${stats.newThisWeek} this week`}
              icon={Users} iconBg="bg-purple-50"
            />
            <StatCard
              title="Active Channels"
              value={loadingStats ? '…' : (stats.activeChannels ?? '-').toLocaleString()}
              change={loadingStats ? '' : `+ ${stats.newChannelsThisWeek} this week`}
              icon={Hash} iconBg="bg-blue-50"
            />
            <StatCard 
              title="Messages Sent" 
              value={loadingStats ? '…' : (stats.totalMessages ?? '-').toLocaleString()} 
              change={loadingStats ? '' : `+ ${stats.messagesThisWeek} this week`} 
              icon={MessageSquare} iconBg="bg-indigo-50" 
            />
            <StatCard 
              title="Meetings Held" 
              value={loadingStats ? '…' : (stats.totalMeetings ?? '-').toLocaleString()} 
              change={loadingStats ? '' : `+ ${stats.meetingsThisWeek} this week`} 
              icon={Video} iconBg="bg-purple-50" 
            />
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.length === 0 && !loadingStats && (
                  <p className="text-sm text-gray-400 text-center py-4">No recent activity yet.</p>
                )}
                {loadingStats && (
                  <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                )}
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}>
                      {item.avatar
                        ? <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                        : item.initials
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.action}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-brand-purple font-semibold hover:underline flex items-center gap-1">
                View all activity <ChevronRight size={13} />
              </button>
            </div>

            {/* Team Activity Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Team Activity</h2>
                <button className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1 flex items-center gap-1 hover:bg-gray-50">
                  This Week <ChevronDown size={12} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={teamActivityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C48F5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6C48F5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="meetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="Messages" stroke="#6C48F5" strokeWidth={2.5} fill="url(#msgGrad)" dot={{ r: 3, fill: '#6C48F5' }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="Meetings" stroke="#3B82F6" strokeWidth={2.5} fill="url(#meetGrad)" dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">Upcoming Meetings</h2>
              <div className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-purple/20 hover:bg-purple-50/30 transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                      <Video size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                      <p className="text-xs text-gray-400">{m.time}</p>
                    </div>
                    <button className="text-xs border border-brand-purple text-brand-purple font-semibold px-4 py-1.5 rounded-lg hover:bg-brand-purple hover:text-white transition-all">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Tasks */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">My Tasks</h2>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 rounded accent-brand-purple cursor-pointer flex-shrink-0"
                    />
                    <span className={`flex-1 text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{task.due}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-brand-purple font-semibold hover:underline flex items-center gap-1">
                View all tasks <ChevronRight size={13} />
              </button>
            </div>
          </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
