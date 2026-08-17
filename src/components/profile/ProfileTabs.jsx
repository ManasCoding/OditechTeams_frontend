import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['Overview', 'About', 'Shared Media', 'Shared Files', 'Activity', 'Settings'];

export default function ProfileTabs({ user, isOwnProfile }) {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => {
          if (tab === 'Settings' && !isOwnProfile) return null;
          
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6 bg-white/50 backdrop-blur-md rounded-3xl p-6 md:p-8 min-h-[300px] border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Overview' && (
              <div className="text-gray-600">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bio</h3>
                <p className="leading-relaxed">{user?.bio || 'No bio provided.'}</p>
              </div>
            )}
            
            {activeTab === 'About' && (
              <div className="space-y-4 text-sm text-gray-600">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Email</span>
                  <span className="col-span-2">{user?.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Phone</span>
                  <span className="col-span-2">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Employee ID</span>
                  <span className="col-span-2">{user?.employeeCode}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Role</span>
                  <span className="col-span-2 capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
            )}

            {activeTab === 'Shared Media' && (
              <div className="text-gray-500 text-sm text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🖼️</span>
                </div>
                No media shared yet.
              </div>
            )}

            {activeTab === 'Shared Files' && (
              <div className="text-gray-500 text-sm text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📁</span>
                </div>
                No files shared yet.
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="text-gray-500 text-sm text-center py-12">
                Recent activity feed will appear here.
              </div>
            )}

            {activeTab === 'Settings' && isOwnProfile && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Settings</h3>
                <p className="text-sm text-gray-500">To edit your profile information, click the "Edit Profile" button at the top.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
