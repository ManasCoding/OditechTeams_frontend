import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff, UserX, Ban, AlertTriangle, X } from 'lucide-react';

export default function AdminActions({ member, onRemove, onPromote, onDemote }) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const handleConfirmRemove = () => {
    onRemove();
    setShowRemoveModal(false);
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest flex items-center gap-2">
        <Shield size={16} className="text-red-500" /> Admin Controls
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => setShowRemoveModal(true)}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-colors"
        >
          <UserX size={20} className="mb-2" />
          <span className="text-xs font-semibold">Remove from Group</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 transition-colors">
          <Shield size={20} className="mb-2" />
          <span className="text-xs font-semibold">Make Admin</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 transition-colors">
          <ShieldOff size={20} className="mb-2" />
          <span className="text-xs font-semibold">Remove Admin</span>
        </button>
        
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
          <Ban size={20} className="mb-2" />
          <span className="text-xs font-semibold">Ban User</span>
        </button>
      </div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {showRemoveModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Remove Member?</h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Are you sure you want to remove <span className="font-bold text-gray-800">{member?.fullName}</span> from the group? This action can be undone by inviting them again.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRemoveModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmRemove}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
