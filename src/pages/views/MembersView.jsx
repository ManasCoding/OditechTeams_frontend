import React, { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';

const AVATAR_COLORS = [
  'bg-brand-purple','bg-pink-400','bg-blue-400','bg-green-400',
  'bg-purple-400','bg-orange-400','bg-teal-400','bg-indigo-400'
];

export default function MembersView() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users');
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        } else {
          setFetchError(true);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(m =>
    (m.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const online = filtered.length; 
  const away = 0;
  const offline = 0;
  const total = filtered.length || 1; 

  const CIRCUMFERENCE = 2 * Math.PI * 54;
  const onlinePct = online / total;
  const awayPct = away / total;

  return (
    <div className="flex h-full bg-[#F8F9FD] p-6 gap-6 overflow-y-auto">

      {/* Main Table Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Members</h2>
          <button className="flex items-center gap-2 bg-brand-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-200">
            <UserPlus size={15} /> Invite Members
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-5 max-w-xs shadow-sm">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Member</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-gray-400">Loading members...</td></tr>
              )}
              {!loading && fetchError && (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-red-400">Failed to load members.</td></tr>
              )}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-gray-400">No members found.</td></tr>
              )}
              {filtered.map((user, i) => {
                const parts = (user.fullName || 'U').split(' ');
                const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
                return (
                  <tr
                    key={user._id || i}
                    className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 capitalize">{user.role || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full bg-green-400`}></span>
                        <span className={`text-sm font-medium text-green-500`}>Online</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">{joined}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-5">Member Stats</h3>

          {/* Donut Chart */}
          <div className="flex justify-center mb-5">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Background */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="#F3F4F6" strokeWidth="14" />
                {/* Offline */}
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="14"
                  strokeDasharray={`${(offline / total) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={0}
                />
                {/* Away */}
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#FCD34D"
                  strokeWidth="14"
                  strokeDasharray={`${awayPct * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-((offline / total) * CIRCUMFERENCE)}
                />
                {/* Online */}
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#6C48F5"
                  strokeWidth="14"
                  strokeDasharray={`${onlinePct * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-(((offline + away) / total) * CIRCUMFERENCE)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400 leading-none">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-purple flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{online}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Away</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{away}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Offline</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{offline}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
