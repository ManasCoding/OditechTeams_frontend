import API_URL from '../../api';
import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, Filter, Edit2, MoreVertical, Users, UserCheck, UserX, UserPlus, ArrowLeft, Upload } from 'lucide-react';

const AVATAR_COLORS = [
  'bg-brand-purple','bg-pink-400','bg-blue-400','bg-green-400',
  'bg-purple-400','bg-orange-400','bg-teal-400','bg-indigo-400'
];

const StatCard = ({ title, value, change, Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 ${iconColor}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-green-500 font-medium mt-1">{change}</p>
    </div>
  </div>
);

export default function UserManagementView({ isAdmin }) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeCode: '',
    role: '',
    department: '',
    designation: ''
  });

  const handleCreateUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('User created successfully.');
        setIsAdding(false);
        setFormData({ fullName: '', email: '', password: '', employeeCode: '', role: '', department: '', designation: '' });
      } else {
        alert(data.message || 'Error creating user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Fetch real users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`${API_URL}/api/users`);
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

  useEffect(() => { fetchUsers(); }, []);

  // After creating a user, refresh the list
  const handleCreateUserAndRefresh = async () => {
    await handleCreateUser();
    fetchUsers();
  };

  const filtered = users.filter(u =>
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isAdding) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FD] p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <p className="text-sm text-gray-400 mt-0.5">Admin &nbsp;/&nbsp; User Management &nbsp;/&nbsp; Add User</p>
          </div>
          <button 
            onClick={() => setIsAdding(false)}
            className="flex items-center gap-2 text-brand-purple text-sm font-semibold hover:text-purple-700 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Users
          </button>
        </div>

        <div className="flex gap-6">
          {/* User Information */}
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Enter full name" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Set password" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Profile Picture</label>
                <div className="flex items-center gap-4 border border-gray-200 border-dashed rounded-xl p-4 bg-gray-50/50">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <Upload size={20} />
                  </div>
                  <div>
                    <button className="text-sm font-semibold text-brand-purple hover:text-purple-700">Upload photo</button>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Role & Department</h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm text-gray-600 bg-white"
                >
                  <option value="">Select role</option>
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Member</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm text-gray-600 bg-white"
                >
                  <option value="">Select department</option>
                  <option>Management</option>
                  <option>Design</option>
                  <option>Development</option>
                  <option>Marketing</option>
                  <option>HR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Designation</label>
                <input 
                  type="text" 
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="Enter designation" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Employee Code</label>
                <input 
                  type="text" 
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                  placeholder="Enter employee code" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm" 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateUserAndRefresh}
                className="px-6 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-md shadow-purple-200"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FD] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Admin &nbsp;/&nbsp; User Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-brand-purple text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={15} /> Export
          </button>
          {isAdmin && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-brand-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200"
            >
              <Plus size={16} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users"       value={loading ? '…' : users.length}                                         change="" Icon={Users}     iconBg="bg-purple-50" iconColor="text-brand-purple" />
        <StatCard title="Active Users"      value={loading ? '…' : users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'Admin' || u.role === 'Super Admin').length} change="" Icon={UserCheck} iconBg="bg-green-50"  iconColor="text-green-500"  />
        <StatCard title="Members"           value={loading ? '…' : users.filter(u => u.role === 'Member' || u.role === 'member').length}                                  change="" Icon={UserX}     iconBg="bg-red-50"    iconColor="text-red-500"    />
        <StatCard title="New This Week"     value={loading ? '…' : users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length}            change="" Icon={UserPlus}  iconBg="bg-yellow-50" iconColor="text-yellow-500" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 w-56">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-3 py-2.5 outline-none hover:bg-gray-50 cursor-pointer">
            <option>All Roles</option>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Member</option>
          </select>
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-3 py-2.5 outline-none hover:bg-gray-50 cursor-pointer">
            <option>All Departments</option>
            <option>Management</option>
            <option>Design</option>
            <option>Development</option>
            <option>Marketing</option>
            <option>HR</option>
          </select>
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-3 py-2.5 outline-none hover:bg-gray-50 cursor-pointer">
            <option>All Status</option>
            <option>Online</option>
            <option>Offline</option>
          </select>
          <div className="flex-1" />
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter size={15} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400">Loading users...</td></tr>
              )}
              {!loading && fetchError && (
                <tr><td colSpan="6" className="px-6 py-10 text-center">
                  <p className="text-sm text-red-400 mb-3">⚠️ Could not connect to the backend. Please restart your backend server.</p>
                  <button onClick={fetchUsers} className="px-4 py-2 bg-brand-purple text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                    Retry
                  </button>
                </td></tr>
              )}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400">No users found. Add your first user!</td></tr>
              )}
              {filtered.map((user, idx) => {
                const parts = (user.fullName || 'U').split(' ');
                const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const joinedAgo = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
                return (
                  <tr key={user._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{user.role || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.department || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{joinedAgo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-brand-purple transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {filtered.length} of {users.length} users</p>
          <div className="flex items-center gap-1">
            {['<', '1', '2', '3', '...', '178', '>'].map((p, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  p === '1'
                    ? 'bg-brand-purple text-white shadow-sm shadow-purple-200'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${p === '...' ? 'border-none text-gray-400 cursor-default' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
