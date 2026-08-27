import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import API_URL from '../../api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to determine meeting color scheme based on title keywords
const getColorForEvent = (title, type = 'cell') => {
  const t = (title || '').toLowerCase();
  if (t.includes('design') || t.includes('review') || t.includes('ui') || t.includes('ux') || t.includes('wireframe')) {
    return type === 'cell' 
      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-400 hover:bg-blue-100/70' 
      : { dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-600', text: 'text-blue-700' };
  }
  if (t.includes('standup') || t.includes('daily') || t.includes('project') || t.includes('scrum') || t.includes('sync')) {
    return type === 'cell' 
      ? 'bg-green-50 text-green-700 border-l-2 border-green-400 hover:bg-green-100/70' 
      : { dot: 'bg-green-500', bg: 'bg-green-100 text-green-600', text: 'text-green-700' };
  }
  if (t.includes('team') || t.includes('weekly') || t.includes('meeting') || t.includes('sprint')) {
    return type === 'cell' 
      ? 'bg-purple-50 text-purple-700 border-l-2 border-purple-400 hover:bg-purple-100/70' 
      : { dot: 'bg-purple-500', bg: 'bg-purple-100 text-purple-600', text: 'text-purple-700' };
  }
  if (t.includes('client') || t.includes('presentation') || t.includes('demo') || t.includes('pitch')) {
    return type === 'cell' 
      ? 'bg-red-50 text-red-700 border-l-2 border-red-400 hover:bg-red-100/70' 
      : { dot: 'bg-red-500', bg: 'bg-red-100 text-red-600', text: 'text-red-700' };
  }
  return type === 'cell' 
    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-400 hover:bg-indigo-100/70' 
    : { dot: 'bg-indigo-500', bg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-700' };
};

// Formatting utilities
const formatTimeOnly = (dateObj) => {
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
};

const formatEventTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const timeStr = formatTimeOnly(d);

  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear();

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow, ${timeStr}`;
  } else {
    return `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${timeStr}`;
  }
};

export default function CalendarView({ loggedInUser }) {
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('1h');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meetings`);
      const data = await res.json();
      if (data.success && data.meetings) {
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'Month') {
        d.setMonth(d.getMonth() - 1);
      } else if (view === 'Week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'Month') {
        d.setMonth(d.getMonth() + 1);
      } else if (view === 'Week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (cellDate) => {
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
    const d = String(cellDate.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${d}`);
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePlusClick = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${d}`);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Meeting title is required.');
      return;
    }
    if (!date || !time) {
      setFormError('Date and time are required.');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`);
      
      // Pull host data from prop or fallback session storage
      let hostUser = loggedInUser;
      if (!hostUser || !hostUser.fullName) {
        try {
          hostUser = JSON.parse(sessionStorage.getItem('user')) || {};
        } catch {
          hostUser = {};
        }
      }
      const hostName = hostUser.fullName || hostUser.email?.split('@')[0] || 'User';
      const hostId = hostUser._id || 'guest_host_id';

      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: title.trim(),
          host: hostName,
          hostId,
          scheduledAt: scheduledAt.toISOString(),
          duration
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTitle('');
        setDuration('1h');
        setIsModalOpen(false);
        await fetchMeetings();
      } else {
        setFormError(data.message || 'Failed to schedule meeting.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute calendar grids
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Grid for Month view (starts Mon, 42 days)
  const getMonthGridDays = () => {
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon, ...
    const prefixDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const gridStart = new Date(year, month, 1 - prefixDays);

    const days = [];
    const today = new Date();
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);

      const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;
      const isToday = d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();

      days.push({
        date: d,
        dayNum: d.getDate(),
        isCurrentMonth,
        isToday
      });
    }
    return days;
  };

  // Grid for Week view (7 days starting Monday of current date week)
  const getWeekGridDays = () => {
    const currentDayOfWeek = currentDate.getDay();
    const prefixDays = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const weekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - prefixDays);

    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      const isToday = d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();

      days.push({
        date: d,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday
      });
    }
    return days;
  };

  // Helper to query events for a particular day
  const getEventsForDay = (dateObj) => {
    return meetings.filter(m => {
      const mDate = new Date(m.scheduledAt);
      return mDate.getDate() === dateObj.getDate() &&
             mDate.getMonth() === dateObj.getMonth() &&
             mDate.getFullYear() === dateObj.getFullYear();
    }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  };

  // Sidebar: top 10 upcoming events
  const now = new Date();
  const upcomingEventsList = meetings
    .filter(m => new Date(m.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 10);

  // Month header text
  const getHeaderTitle = () => {
    if (view === 'Month') {
      return `${monthNames[month]} ${year}`;
    } else if (view === 'Week') {
      const weekDays = getWeekGridDays();
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()].slice(0, 3)} ${start.getFullYear()}`;
      } else {
        return `${monthNames[start.getMonth()].slice(0, 3)} - ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="flex h-full bg-[#F8F9FD]">
      {/* Left: Dynamic Upcoming Events */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <button onClick={handlePrev} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"><ChevronLeft size={16} /></button>
          <span className="text-xs font-bold text-gray-700">Navigation</span>
          <button onClick={handleNext} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"><ChevronRight size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Upcoming Schedule</h3>
          
          {loading && meetings.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Loading schedules...</p>
          ) : upcomingEventsList.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEventsList.map((ev, i) => {
                const style = getColorForEvent(ev.title, 'sidebar');
                return (
                  <div key={i} className="flex items-start gap-2.5 group cursor-pointer" onClick={() => setCurrentDate(new Date(ev.scheduledAt))}>
                    <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${style.dot}`} style={{ minHeight: '34px' }}></div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 group-hover:text-brand-purple transition-colors leading-tight truncate">{ev.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatEventTime(ev.scheduledAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0 gap-4">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"><ChevronLeft size={16} /></button>
            <h2 className="text-base font-bold text-gray-900 min-w-[140px] text-center">{getHeaderTitle()}</h2>
            <button onClick={handleNext} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"><ChevronRight size={16} /></button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleGoToday} className="text-xs font-bold text-gray-600 border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Today
            </button>
            
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {['Month', 'Week', 'Day'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    view === v
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button onClick={handlePlusClick} className="w-9 h-9 bg-brand-purple hover:bg-purple-700 text-white rounded-xl flex items-center justify-center transition-all shadow-[0_4px_14px_0_rgba(108,72,245,0.3)]">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Grid Header for Month & Week */}
        {view !== 'Day' && (
          <div className="grid grid-cols-7 border-b border-gray-100 bg-white flex-shrink-0">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Body based on active view */}
        <div className="flex-1 overflow-y-auto">
          {view === 'Month' && (
            <div className="grid grid-cols-7 h-full min-h-[500px]" style={{ gridTemplateRows: 'repeat(6, minmax(100px, 1fr))' }}>
              {getMonthGridDays().map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                return (
                  <div
                    key={idx}
                    onClick={() => handleCellClick(cell.date)}
                    className={`border-b border-r border-gray-100 p-2 cursor-pointer transition-all flex flex-col group ${
                      !cell.isCurrentMonth ? 'bg-gray-50/40 text-gray-300' : 'bg-white hover:bg-purple-50/20'
                    }`}
                  >
                    <div className="flex justify-end mb-1 flex-shrink-0">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        cell.isToday
                          ? 'bg-brand-purple text-white shadow-sm'
                          : cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {cell.dayNum}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {dayEvents.map((m, mIdx) => (
                        <div 
                          key={mIdx} 
                          onClick={(e) => {
                            e.stopPropagation(); // prevent modal opening
                            setCurrentDate(new Date(m.scheduledAt));
                            setView('Day');
                          }}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold leading-tight truncate shadow-sm transition-all ${getColorForEvent(m.title, 'cell')}`}
                        >
                          <div className="truncate font-semibold">{m.title}</div>
                          <div className="opacity-75 font-medium mt-0.5">{formatTimeOnly(new Date(m.scheduledAt))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'Week' && (
            <div className="grid grid-cols-7 h-full min-h-[400px]">
              {getWeekGridDays().map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                return (
                  <div
                    key={idx}
                    onClick={() => handleCellClick(cell.date)}
                    className="border-r border-b border-gray-100 p-3 hover:bg-purple-50/20 transition-all flex flex-col bg-white"
                  >
                    <div className="flex justify-between items-center mb-3 flex-shrink-0 border-b border-gray-50 pb-1.5">
                      <span className="text-xs font-bold text-gray-400 uppercase">{DAYS[idx]}</span>
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                        cell.isToday ? 'bg-brand-purple text-white shadow-sm' : 'text-gray-700'
                      }`}>
                        {cell.dayNum}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                      {dayEvents.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[10px] text-gray-300 italic font-medium">Free</span>
                        </div>
                      ) : (
                        dayEvents.map((m, mIdx) => (
                          <div 
                            key={mIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDate(new Date(m.scheduledAt));
                              setView('Day');
                            }}
                            className={`rounded-xl p-2 text-[10px] font-bold leading-tight shadow-sm transition-all flex flex-col gap-0.5 ${getColorForEvent(m.title, 'cell')}`}
                          >
                            <div className="font-bold truncate">{m.title}</div>
                            <div className="opacity-80 font-medium flex items-center gap-1"><Clock size={10} /> {formatTimeOnly(new Date(m.scheduledAt))}</div>
                            <div className="opacity-80 font-medium flex items-center gap-1"><User size={10} /> {m.host}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'Day' && (
            <div className="flex-1 bg-white p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      {getEventsForDay(currentDate).length} scheduled event(s) for this day
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCellClick(currentDate)}
                    className="bg-brand-purple hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(108,72,245,0.3)] flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Schedule Event
                  </button>
                </div>
                
                {getEventsForDay(currentDate).length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
                    <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">No events scheduled for this day</p>
                    <p className="text-xs text-gray-400 mt-1">Click Schedule Event to add a meeting</p>
                  </div>
                ) : (
                  <div className="relative border-l border-gray-200 pl-6 ml-3 space-y-6">
                    {getEventsForDay(currentDate).map((m, idx) => {
                      const styleObj = getColorForEvent(m.title, 'sidebar');
                      const dateObj = new Date(m.scheduledAt);
                      return (
                        <div key={idx} className="relative group">
                          {/* Circle on timeline */}
                          <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${styleObj.dot}`} />
                          
                          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-all group-hover:border-purple-200/50">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className={`font-bold transition-colors text-base ${styleObj.text}`}>{m.title}</h4>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2.5">
                                  <span className="flex items-center gap-1"><Clock size={13} /> {formatTimeOnly(dateObj)} ({m.duration || '1h'})</span>
                                  <span className="flex items-center gap-1"><User size={13} /> Hosted by {m.host}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">{m.meetingId}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Add Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-purple to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <h3 className="font-bold text-base">Schedule New Meeting</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Standup / Design Sync"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple bg-white transition-all text-sm cursor-pointer"
                  >
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="45m">45 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="1.5h">1.5 Hours</option>
                    <option value="2h">2 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Organizer / Host</label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm flex items-center gap-2 select-none truncate">
                    <User size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      {loggedInUser?.fullName || (sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user'))?.fullName : 'User')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-purple hover:bg-purple-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_0_rgba(108,72,245,0.3)] flex items-center gap-1.5"
                >
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
