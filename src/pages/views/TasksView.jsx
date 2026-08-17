import React, { useState } from 'react';
import {
  Plus, Search, Filter, ChevronDown, MoreHorizontal,
  CheckSquare, Clock, AlertCircle, CheckCircle2,
  Calendar, Tag, User, Paperclip, MessageSquare,
  ArrowUpRight, Circle, Flag
} from 'lucide-react';

const initialTasks = {
  todo: [
    {
      id: 1, title: 'Design new onboarding flow', priority: 'High',
      assignee: { name: 'Priya Sharma', initials: 'PS', color: 'bg-pink-400' },
      due: 'Jul 12', tags: ['Design', 'UX'], attachments: 2, comments: 4,
      progress: 0,
    },
    {
      id: 2, title: 'Write API documentation for v2', priority: 'Medium',
      assignee: { name: 'Rohit Verma', initials: 'RV', color: 'bg-blue-400' },
      due: 'Jul 15', tags: ['Docs'], attachments: 0, comments: 1,
      progress: 0,
    },
    {
      id: 3, title: 'Set up CI/CD pipeline for staging', priority: 'Low',
      assignee: { name: 'Aman Singh', initials: 'AS', color: 'bg-green-400' },
      due: 'Jul 20', tags: ['DevOps'], attachments: 1, comments: 0,
      progress: 0,
    },
  ],
  inProgress: [
    {
      id: 4, title: 'Implement role-based access control', priority: 'High',
      assignee: { name: 'Manas Kumar', initials: 'MK', color: 'bg-brand-purple' },
      due: 'Jul 10', tags: ['Backend', 'Security'], attachments: 3, comments: 7,
      progress: 65,
    },
    {
      id: 5, title: 'Migrate database to PostgreSQL', priority: 'High',
      assignee: { name: 'Vikram Mehta', initials: 'VM', color: 'bg-orange-400' },
      due: 'Jul 11', tags: ['Database'], attachments: 0, comments: 3,
      progress: 40,
    },
    {
      id: 6, title: 'Build notification center UI', priority: 'Medium',
      assignee: { name: 'Neha Patel', initials: 'NP', color: 'bg-purple-400' },
      due: 'Jul 14', tags: ['Frontend'], attachments: 1, comments: 5,
      progress: 80,
    },
  ],
  review: [
    {
      id: 7, title: 'Code review: Auth module refactor', priority: 'High',
      assignee: { name: 'Aman Singh', initials: 'AS', color: 'bg-green-400' },
      due: 'Jul 9', tags: ['Backend'], attachments: 2, comments: 9,
      progress: 100,
    },
    {
      id: 8, title: 'QA: Mobile responsiveness testing', priority: 'Medium',
      assignee: { name: 'Priya Sharma', initials: 'PS', color: 'bg-pink-400' },
      due: 'Jul 10', tags: ['QA', 'Mobile'], attachments: 4, comments: 2,
      progress: 100,
    },
  ],
  done: [
    {
      id: 9, title: 'Set up project repository structure', priority: 'Low',
      assignee: { name: 'Manas Kumar', initials: 'MK', color: 'bg-brand-purple' },
      due: 'Jul 1', tags: ['Setup'], attachments: 0, comments: 2,
      progress: 100,
    },
    {
      id: 10, title: 'Create wireframes for dashboard', priority: 'Medium',
      assignee: { name: 'Priya Sharma', initials: 'PS', color: 'bg-pink-400' },
      due: 'Jul 3', tags: ['Design'], attachments: 5, comments: 6,
      progress: 100,
    },
    {
      id: 11, title: 'Integrate Recharts for analytics', priority: 'Low',
      assignee: { name: 'Rohit Verma', initials: 'RV', color: 'bg-blue-400' },
      due: 'Jul 5', tags: ['Frontend'], attachments: 1, comments: 3,
      progress: 100,
    },
  ],
};

const columns = [
  { key: 'todo',       label: 'To Do',       icon: Circle,        color: 'text-gray-400',   bg: 'bg-gray-50',    border: 'border-gray-200',  dot: 'bg-gray-400'   },
  { key: 'inProgress', label: 'In Progress',  icon: Clock,         color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-400'   },
  { key: 'review',     label: 'In Review',    icon: AlertCircle,   color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-400'  },
  { key: 'done',       label: 'Done',         icon: CheckCircle2,  color: 'text-green-500',  bg: 'bg-green-50',   border: 'border-green-200', dot: 'bg-green-400'  },
];

const priorityConfig = {
  High:   { label: 'High',   bg: 'bg-red-50',     text: 'text-red-500',    icon: 'text-red-400'    },
  Medium: { label: 'Medium', bg: 'bg-amber-50',   text: 'text-amber-500',  icon: 'text-amber-400'  },
  Low:    { label: 'Low',    bg: 'bg-green-50',   text: 'text-green-600',  icon: 'text-green-500'  },
};

const tagColors = {
  Design: 'bg-pink-100 text-pink-600',
  UX: 'bg-purple-100 text-purple-600',
  Docs: 'bg-blue-100 text-blue-600',
  DevOps: 'bg-orange-100 text-orange-600',
  Backend: 'bg-gray-100 text-gray-600',
  Security: 'bg-red-100 text-red-600',
  Database: 'bg-indigo-100 text-indigo-600',
  Frontend: 'bg-cyan-100 text-cyan-600',
  QA: 'bg-green-100 text-green-600',
  Mobile: 'bg-teal-100 text-teal-600',
  Setup: 'bg-yellow-100 text-yellow-600',
};

function TaskCard({ task, colKey }) {
  const pCfg = priorityConfig[task.priority];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all cursor-pointer group">
      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {task.tags.map(tag => (
          <span
            key={tag}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-500'}`}
          >
            {tag}
          </span>
        ))}
        <span className={`ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${pCfg.bg} ${pCfg.text}`}>
          <Flag size={9} className={pCfg.icon} />
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <p className={`text-sm font-semibold leading-snug mb-3 ${colKey === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
        {task.title}
      </p>

      {/* Progress bar (only for in-progress & review) */}
      {(colKey === 'inProgress' || colKey === 'review') && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-medium">Progress</span>
            <span className="text-[10px] font-bold text-gray-600">{task.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-purple to-blue-500 transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-1">
        {/* Assignee */}
        <div
          className={`w-6 h-6 rounded-full ${task.assignee.color} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}
          title={task.assignee.name}
        >
          {task.assignee.initials}
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Calendar size={11} />
          <span>{task.due}</span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto text-gray-300">
          {task.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <Paperclip size={11} /> {task.attachments}
            </span>
          )}
          {task.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <MessageSquare size={11} /> {task.comments}
            </span>
          )}
          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksView() {
  const [tasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const totalTasks = Object.values(tasks).flat().length;
  const doneTasks = tasks.done.length;
  const inProgressCount = tasks.inProgress.length;
  const overdue = 2; // mock

  const filterTask = (task) => {
    const matchSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                        task.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchSearch && matchPriority;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FD] overflow-hidden">

      {/* Header area */}
      <div className="px-6 pt-5 pb-4 flex-shrink-0">

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <CheckSquare size={18} className="text-brand-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{doneTasks}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdue}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-64">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  priorityFilter === p
                    ? 'bg-brand-purple text-white border-brand-purple shadow-md shadow-purple-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-purple/40 hover:text-brand-purple'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-all shadow-sm">
              <Filter size={13} /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-purple rounded-xl px-4 py-2 hover:bg-purple-700 transition-all shadow-md shadow-purple-200">
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <div className="flex gap-4 h-full" style={{ minWidth: '900px' }}>
          {columns.map(col => {
            const ColIcon = col.icon;
            const filtered = tasks[col.key].filter(filterTask);
            return (
              <div key={col.key} className="flex flex-col flex-1 min-w-0">
                {/* Column header */}
                <div className={`flex items-center gap-2 mb-3 px-1`}>
                  <ColIcon size={15} className={col.color} />
                  <span className="text-sm font-bold text-gray-700">{col.label}</span>
                  <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                    {filtered.length}
                  </span>
                  <button className="ml-auto opacity-50 hover:opacity-100 transition-opacity">
                    <Plus size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* Column drop zone */}
                <div className={`flex-1 overflow-y-auto rounded-2xl ${col.bg} border ${col.border} p-3 space-y-3`}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                      <ColIcon size={24} className={`${col.color} opacity-30 mb-2`} />
                      <p className="text-xs text-gray-400">No tasks here</p>
                    </div>
                  ) : (
                    filtered.map(task => (
                      <TaskCard key={task.id} task={task} colKey={col.key} />
                    ))
                  )}

                  {/* Add task inline button */}
                  <button className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-brand-purple py-2 px-3 rounded-xl hover:bg-white/60 transition-all border border-dashed border-gray-200 hover:border-brand-purple/30">
                    <Plus size={13} /> Add a task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
