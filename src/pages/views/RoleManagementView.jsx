import React, { useState } from 'react';
import { Edit2, Trash2, Shield } from 'lucide-react';

const roles = [
  { id: 1, name: 'Super Admin', users: 1,    permissions: 'All Permissions', permBadge: 'bg-brand-purple text-white', initials: 'SA', color: 'bg-brand-purple'  },
  { id: 2, name: 'Admin',       users: 5,    permissions: '8 Permissions',   permBadge: 'bg-blue-100 text-blue-700',  initials: 'A',  color: 'bg-blue-500'     },
  { id: 3, name: 'Manager',     users: 12,   permissions: '6 Permissions',   permBadge: 'bg-green-100 text-green-700',initials: 'M',  color: 'bg-green-500'    },
  { id: 4, name: 'Member',      users: 1024, permissions: '4 Permissions',   permBadge: 'bg-gray-100 text-gray-600',  initials: 'Me', color: 'bg-gray-400'     },
  { id: 5, name: 'Guest',       users: 206,  permissions: '2 Permissions',   permBadge: 'bg-orange-100 text-orange-700', initials: 'G', color: 'bg-orange-400' },
];

const activeUsers = [
  { name: 'Priya Sharma', status: 'Online',  activity: 'Working on Figma file',  location: 'India', device: 'Windows', initials: 'PS', color: 'bg-pink-400'   },
  { name: 'Rohit Verma',  status: 'Online',  activity: 'In a meeting',            location: 'India', device: 'MacOS',   initials: 'RV', color: 'bg-blue-400'   },
  { name: 'Aman Singh',   status: 'Online',  activity: 'Typing in #general',      location: 'India', device: 'Windows', initials: 'AS', color: 'bg-green-400'  },
  { name: 'Neha Patel',   status: 'Offline', activity: 'Last seen 1h ago',        location: 'India', device: 'Mobile',  initials: 'NP', color: 'bg-purple-400' },
  { name: 'Vikram Mehta', status: 'Online',  activity: 'Uploading a file',        location: 'India', device: 'Windows', initials: 'VM', color: 'bg-orange-400' },
];

const allPermissions = [
  'Dashboard Access',
  'User Management',
  'Channel Management',
  'Chat Access',
  'Meeting Management',
  'File Management',
  'System Access',
  'Reports Access',
];

export default function RoleManagementView() {
  const [checked, setChecked] = useState(allPermissions.reduce((a, p) => ({ ...a, [p]: true }), {}));
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const toggle = (p) => setChecked(c => ({ ...c, [p]: !c[p] }));

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
        <p className="text-sm text-gray-400 mt-0.5">Admin &nbsp;/&nbsp; Role Management</p>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-[300px_1fr] gap-5">

        {/* Left — Add New Role */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-fit">
          <h3 className="text-base font-bold text-gray-900 mb-5">Add New Role</h3>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role Name</label>
            <input
              type="text"
              placeholder="Enter role name"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all placeholder-gray-400"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea
              placeholder="Enter role description"
              value={roleDesc}
              onChange={e => setRoleDesc(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all placeholder-gray-400 resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 mb-3">Permissions</label>
            <div className="space-y-2.5">
              {allPermissions.map(p => (
                <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!checked[p]}
                    onChange={() => toggle(p)}
                    className="w-4 h-4 rounded accent-brand-purple cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setRoleName(''); setRoleDesc(''); }}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 bg-brand-purple text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200">
              Create Role
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* All Roles table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">All Roles</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Permissions</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${r.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {r.initials}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-sm text-gray-600">{r.users.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${r.permBadge}`}>
                        {r.permissions}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-brand-purple transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Showing 1 to 5 of 5 roles</p>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm">&lt;</button>
                <button className="w-7 h-7 rounded-lg bg-brand-purple text-white font-semibold text-sm flex items-center justify-center">1</button>
                <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm">&gt;</button>
              </div>
            </div>
          </div>

          {/* Active Users Monitoring */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Active Users Monitoring</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-green-600">Live</span>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((u, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${u.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {u.initials}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold ${u.status === 'Online' ? 'text-green-600' : 'text-gray-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{u.activity}</td>
                    <td className="py-3 text-sm text-gray-600">{u.location}</td>
                    <td className="py-3 text-sm text-gray-600">{u.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="mt-4 text-xs font-semibold text-brand-purple hover:underline">View all users</button>
          </div>

        </div>
      </div>
    </div>
  );
}
