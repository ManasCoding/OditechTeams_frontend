import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const calendarData = {
  // week starting May 27 row
  events: [
    { day: 28, title: 'Design Review', time: '11:00 AM', color: 'bg-blue-100 text-blue-700', border: 'border-l-2 border-blue-400' },
    { day: 29, title: 'Project X Standup', time: '12:00 AM', color: 'bg-green-100 text-green-700', border: 'border-l-2 border-green-400' },
    { day: 29, title: 'Project X Standup', time: '12:00 AM', color: 'bg-green-100 text-green-700', border: 'border-l-2 border-green-400', extra: '+ 1 more' },
    { day: 30, title: 'Weekly Team Sync/M', time: '2:00 PM', color: 'bg-purple-100 text-purple-700', border: 'border-l-2 border-purple-400' },
    { day: 31, title: 'Client Presentation', time: '3:00 PM', color: 'bg-red-100 text-red-700', border: 'border-l-2 border-red-400' },
  ],
};

const upcomingEvents = [
  { title: 'Design Review Meeting', when: 'Today, 11:00 AM', color: 'bg-blue-500' },
  { title: 'Project X Standup', when: 'Tomorrow, 10:00 AM', color: 'bg-green-500' },
  { title: 'Weekly Team Sync', when: 'May 26, 2:00 PM', color: 'bg-purple-500' },
  { title: 'Client Presentation', when: 'May 30, 5:00 PM', color: 'bg-red-500' },
];

const weeks = [
  [27, 28, 29, 30, 31, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29, 30],
  [31, 1, 2, 3, 4, 5, 6],
];

const eventsByDay = {
  28: [{ title: 'Design Review', time: '11:00 AM', color: 'bg-blue-100 text-blue-700 border-l-2 border-blue-400' }],
  29: [{ title: 'Project X Standup', time: '12:00 PM', color: 'bg-green-100 text-green-700 border-l-2 border-green-400', extra: '+ 1 more' }],
  30: [{ title: 'Weekly Team Sync/M', time: '2:00 PM', color: 'bg-purple-100 text-purple-700 border-l-2 border-purple-400' }],
  31: [{ title: 'Client Presentation', time: '3:00 PM', color: 'bg-red-100 text-red-700 border-l-2 border-red-400' }],
};

export default function CalendarView() {
  const [view, setView] = useState('Month');
  const [selectedDay, setSelectedDay] = useState(null);

  const isCurrentMonth = (d, weekIdx) => {
    if (weekIdx === 0 && d > 20) return false;
    if (weekIdx === weeks.length - 1 && d < 10) return false;
    return true;
  };

  const isToday = (d, weekIdx) => d === 29 && weekIdx === 0;

  return (
    <div className="flex h-full bg-[#F8F9FD]">
      {/* Left: Upcoming Events */}
      <div className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-gray-700">Today</span>
          <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-2.5 group cursor-pointer">
                <div className={`w-1 rounded-full mt-1 flex-shrink-0 self-stretch ${ev.color}`} style={{ minHeight: '32px' }}></div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-brand-purple transition-colors leading-tight">{ev.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ev.when}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 text-xs text-brand-purple font-semibold hover:underline">View all events</button>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Calendar Topbar */}
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={16} /></button>
            <h2 className="text-base font-bold text-gray-900 min-w-[100px] text-center">May 2024</h2>
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={16} /></button>
            <button className="text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">Today</button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
            {['Month', 'Week', 'Day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  view === v
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors">
            <Plus size={15} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white flex-shrink-0">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(80px, 1fr))` }}>
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const inMonth = isCurrentMonth(day, wi);
                const today = isToday(day, wi);
                const evs = (wi === 0 && eventsByDay[day]) ? eventsByDay[day] : [];
                return (
                  <div
                    key={`${wi}-${di}`}
                    onClick={() => setSelectedDay({ day, week: wi })}
                    className={`border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                      !inMonth ? 'bg-gray-50/50' : 'hover:bg-purple-50/30'
                    } ${selectedDay?.day === day && selectedDay?.week === wi ? 'bg-purple-50' : ''}`}
                  >
                    <div className="flex justify-end mb-1">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                        today
                          ? 'bg-brand-purple text-white'
                          : inMonth ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {evs.map((ev, ei) => (
                        <div key={ei} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight truncate ${ev.color}`}>
                          <div>{ev.title}</div>
                          <div className="font-normal opacity-75">{ev.time}</div>
                          {ev.extra && <div className="font-normal">{ev.extra}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
