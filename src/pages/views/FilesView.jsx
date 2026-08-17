import React, { useState } from 'react';
import { Search, Upload, FileText, File, Archive, FileImage, Film, MoreHorizontal } from 'lucide-react';

const files = [
  { id: 1, name: 'Project Guidelines.pdf', size: '2.4 MB', date: 'May 24, 2024', type: 'pdf', icon: FileText, iconColor: 'text-red-500', iconBg: 'bg-red-50' },
  { id: 2, name: 'Design System.fig', size: '15.8 MB', date: 'May 24, 2024', type: 'fig', icon: FileImage, iconColor: 'text-pink-500', iconBg: 'bg-pink-50' },
  { id: 3, name: 'Brand Assets.zip', size: '45.2 MB', date: 'May 23, 2024', type: 'zip', icon: Archive, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
  { id: 4, name: 'Meeting Notes.docx', size: '1.2 MB', date: 'May 23, 2024', type: 'docx', icon: FileText, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  { id: 5, name: 'Project Update.pptx', size: '8.7 MB', date: 'May 22, 2024', type: 'pptx', icon: File, iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
];

const categories = [
  { label: 'Documents', icon: FileText, count: 45, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Images', icon: FileImage, count: 32, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Videos', icon: Film, count: 12, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Others', icon: File, count: 8, color: 'text-gray-500', bg: 'bg-gray-50' },
];

export default function FilesView() {
  const [search, setSearch] = useState('');

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGB = 2.4;
  const maxGB = 10;
  const usedPct = (totalGB / maxGB) * 100;

  return (
    <div className="flex h-full bg-[#F8F9FD] p-6 gap-6 overflow-y-auto">

      {/* Main Files Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Files</h2>
          <button className="flex items-center gap-2 bg-brand-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-200">
            <Upload size={15} /> Upload File
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-5 max-w-xs shadow-sm">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
          />
        </div>

        {/* File List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Files</p>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map(f => {
              const IconComp = f.icon;
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <IconComp size={18} className={f.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                  </div>
                  <span className="text-sm text-gray-400 w-16 text-right">{f.size}</span>
                  <span className="text-sm text-gray-400 w-28 text-right">{f.date}</span>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Storage Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-4">
        {/* Storage Usage */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Storage Usage</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{totalGB} GB</span> / {maxGB} GB
            </span>
            <span className="text-sm font-bold text-brand-purple">{Math.round(usedPct)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-blue-400 rounded-full transition-all duration-700"
              style={{ width: `${usedPct}%` }}
            ></div>
          </div>
        </div>

        {/* File Categories */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">File Categories</h3>
          <div className="space-y-2.5">
            {categories.map((c, i) => {
              const IconComp = c.icon;
              return (
                <div key={i} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1.5 -mx-1.5 cursor-pointer transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconComp size={15} className={c.color} />
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{c.label}</span>
                  <span className="text-sm font-bold text-gray-900">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
