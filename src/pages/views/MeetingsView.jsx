import API_URL from '../../api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Plus, Search, Calendar, Clock, Users, Link2,
  Mic, MicOff, VideoOff, MoreVertical, ChevronRight, Play
} from 'lucide-react';

const avatarColors = {
  MK: 'bg-brand-purple', PS: 'bg-pink-400', RV: 'bg-blue-400',
  AS: 'bg-green-400', NP: 'bg-purple-400', SK: 'bg-teal-400', VM: 'bg-orange-400',
};

// Colors for UI random rotation or hashing
const colorPresets = [
  { color: 'bg-blue-500', light: 'bg-blue-50', accent: 'text-blue-600' },
  { color: 'bg-green-500', light: 'bg-green-50', accent: 'text-green-600' },
  { color: 'bg-purple-500', light: 'bg-purple-50', accent: 'text-purple-600' },
  { color: 'bg-orange-500', light: 'bg-orange-50', accent: 'text-orange-600' },
];

export default function MeetingsView({ isAdmin }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  
  const [meetings, setMeetings] = useState([]);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState('1h');
  const [newAttendees, setNewAttendees] = useState(''); // Just a placeholder for now

  useEffect(() => {
    fetch(`${API_URL}/api/meetings`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMeetings(data.meetings);
        }
      })
      .catch(err => console.error('Error fetching meetings:', err));
  }, []);

  const joinMeeting = (meeting) => {
    // Use the canonical short meetingId stored in the database (e.g. "ABC123")
    const id = meeting.meetingId || meeting._id;
    navigate(`/meeting/${id}`, {
      state: { meeting, isAdmin }
    });
  };

  const handleCreateMeeting = async () => {
    if (!newTitle) {
      alert("Please enter a meeting title.");
      return;
    }
    
    try {
      const userStr = sessionStorage.getItem('user');
      let hostName = 'Unknown';
      let hostId   = 'unknown';
      if (userStr) {
        const u = JSON.parse(userStr);
        hostName = u.fullName || 'Unknown';
        hostId   = u._id || u.id || 'unknown';
      }
      
      const payload = {
        title: newTitle,
        host:  hostName,
        hostId,
        scheduledAt: newDate || new Date().toISOString(),
        duration: newDuration
      };
      
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMeetings([data.meeting, ...meetings]);
        setShowNew(false);
        setNewTitle('');
        setNewDate('');
        setNewAttendees('');
      } else {
        alert(data.message || 'Failed to create meeting');
      }
    } catch(err) {
      console.error(err);
      alert('Network error while creating meeting');
    }
  };

  const now = new Date();
  
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduledAt) >= now);
  const pastMeetings = meetings.filter(m => new Date(m.scheduledAt) < now);

  const filteredUpcoming = upcomingMeetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] p-6 overflow-y-auto gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meetings</h2>
          <p className="text-sm text-gray-400 mt-0.5">Schedule, join and manage your meetings</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-brand-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200"
          >
            <Plus size={16} /> New Meeting
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Scheduled',   value: upcomingMeetings.length,  sub: 'upcoming',  color: 'text-brand-purple', bg: 'bg-purple-50', Icon: Calendar },
          { label: 'Total',       value: meetings.length,   sub: 'meetings',    color: 'text-blue-500',     bg: 'bg-blue-50',   Icon: Clock    },
          { label: 'Participants',value: 'Avg 4',  sub: 'per meeting', color: 'text-green-500',   bg: 'bg-green-50',  Icon: Users    },
          { label: 'History', value: pastMeetings.length, sub: 'past meetings',  color: 'text-orange-500',   bg: 'bg-orange-50', Icon: Video    },
        ].map(({ label, value, sub, color, bg, Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming meetings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Upcoming Meetings</h3>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-56">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredUpcoming.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No upcoming meetings found.</p>
          )}
          {filteredUpcoming.map((m, index) => {
            const preset = colorPresets[index % colorPresets.length];
            const dateObj = new Date(m.scheduledAt);
            const timeStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Using first two letters of host as attendees mock for UI consistency
            const hostInitials = m.host.substring(0, 2).toUpperCase() || 'UK';

            return (
              <div
                key={m._id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-brand-purple/20 hover:bg-purple-50/20 transition-all group"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${preset.light} flex items-center justify-center flex-shrink-0`}>
                  <Video size={20} className={preset.accent} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{m.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} /> {timeStr}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{m.duration || '1h'}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">Host: {m.host}</span>
                  </div>
                </div>

                {/* Avatars */}
                <div className="flex items-center -space-x-2 mr-2">
                  <div className={`w-7 h-7 rounded-full bg-brand-purple flex items-center justify-center text-white text-[10px] font-bold border-2 border-white`}>
                    {hostInitials}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/meeting/${m.meetingId || m._id}`);
                      alert("Link copied!");
                    }}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Link2 size={12} /> Copy Link
                  </button>
                  <button
                    onClick={() => joinMeeting(m)}
                    className="flex items-center gap-1.5 text-xs bg-brand-purple text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                  >
                    <Video size={12} /> Join
                  </button>
                </div>
                <button
                  onClick={() => joinMeeting(m)}
                  className="md:hidden flex items-center gap-1.5 text-xs bg-brand-purple text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 ml-auto flex-shrink-0"
                >
                  <Video size={12} /> Join
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past meetings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Past Meetings</h3>
        </div>
        
        {pastMeetings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No past meetings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Host</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participants</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recording</th>
                </tr>
              </thead>
              <tbody>
                {pastMeetings.map(m => {
                  const dateObj = new Date(m.scheduledAt);
                  const dateStr = dateObj.toLocaleDateString();
                  return (
                    <tr key={m._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Video size={14} className="text-brand-purple" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-sm text-gray-500">{m.host}</td>
                      <td className="py-3.5 text-sm text-gray-500">{dateStr}</td>
                      <td className="py-3.5 text-sm text-gray-500">{m.duration || '1h'}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users size={13} className="text-gray-400" /> {m.participants || 4}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors">
                          <Play size={11} /> Watch
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New meeting modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">Start New Meeting</h3>
            <div className="space-y-3 mb-5">
              <input 
                type="text" 
                placeholder="Meeting title" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all placeholder-gray-400" 
              />
              <input 
                type="datetime-local" 
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-gray-600" 
              />
              <select 
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-gray-600"
              >
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="45m">45 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="1.5h">1.5 Hours</option>
                <option value="2h">2 Hours</option>
              </select>
              <input 
                type="text" 
                placeholder="Invite attendees (emails)..." 
                value={newAttendees}
                onChange={e => setNewAttendees(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all placeholder-gray-400" 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleCreateMeeting} className="flex-1 bg-brand-purple text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200">Create Meeting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

