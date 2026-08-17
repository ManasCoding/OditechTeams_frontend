import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Image, Mic, Video, Users } from 'lucide-react';

const statsData = [
  { label: 'Total Messages', value: '12.5k', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Files Shared', value: '342', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Images Shared', value: '891', icon: Image, color: 'text-pink-500', bg: 'bg-pink-50' },
  { label: 'Voice Calls', value: '45', icon: Mic, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Video Calls', value: '12', icon: Video, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Groups Joined', value: '8', icon: Users, color: 'text-teal-500', bg: 'bg-teal-50' },
];

export default function ProfileStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      {statsData.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white flex flex-col items-center justify-center text-center cursor-default"
        >
          <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-3 shadow-sm`}>
            <stat.icon size={22} className={stat.color} />
          </div>
          <motion.h3 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + (0.1 * i), type: 'spring' }}
            className="text-2xl font-bold text-gray-900"
          >
            {stat.value}
          </motion.h3>
          <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
