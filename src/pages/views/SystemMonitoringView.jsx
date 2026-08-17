import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Activity, AlertTriangle, Bell, Database, HardDrive, Mail, Server, Wifi } from 'lucide-react';

const timeData = [
  { t: '12AM', cpu: 20, mem: 55, net: 30, disk: 60 },
  { t: '6AM',  cpu: 35, mem: 60, net: 45, disk: 62 },
  { t: '12PM', cpu: 28, mem: 58, net: 35, disk: 64 },
  { t: '6PM',  cpu: 40, mem: 65, net: 50, disk: 66 },
  { t: '12AM', cpu: 23, mem: 62, net: 43, disk: 68 },
];

const services = [
  { name: 'API Server',       icon: Server,    status: 'Online', uptime: '99.9%', response: '12ms'  },
  { name: 'Database',         icon: Database,  status: 'Online', uptime: '99.8%', response: '45ms'  },
  { name: 'WebSocket Server', icon: Wifi,      status: 'Online', uptime: '99.9%', response: '98ms'  },
  { name: 'File Storage',     icon: HardDrive, status: 'Online', uptime: '99.7%', response: '210ms' },
  { name: 'Email Service',    icon: Mail,      status: 'Online', uptime: '99.9%', response: '320ms' },
];

const alerts = [
  { id: 1, title: 'High Memory Usage',           desc: 'Memory usage is above 80%',                   time: '2m ago',  color: 'bg-red-100',    icon: AlertTriangle, iconColor: 'text-red-500'    },
  { id: 2, title: 'Database Backup Completed',   desc: 'Daily backup completed successfully',          time: '1h ago',  color: 'bg-green-100',  icon: Database,      iconColor: 'text-green-600'  },
  { id: 3, title: 'New User Registration Spike', desc: 'High number of new user registrations',        time: '3h ago',  color: 'bg-blue-100',   icon: Bell,          iconColor: 'text-blue-500'   },
];

const MiniChart = ({ data, dataKey, color, label, value }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}%</p>
    </div>
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
    </div>
  </div>
);

export default function SystemMonitoringView() {
  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
          <p className="text-sm text-gray-400 mt-0.5">Admin &nbsp;/&nbsp; System Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-4 py-2.5 outline-none hover:bg-gray-50 cursor-pointer shadow-sm">
            <option>Real-time</option>
            <option>Historical</option>
          </select>
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-4 py-2.5 outline-none hover:bg-gray-50 cursor-pointer shadow-sm">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Server Health Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Server Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-gray-500 font-medium">Server Status</p>
          </div>
          <p className="text-2xl font-bold text-green-500">Healthy</p>
          <p className="text-xs text-gray-400 mt-1">All systems operational</p>
        </div>
        {/* CPU */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">CPU Usage</p>
            <p className="text-2xl font-bold text-gray-900">23%</p>
            <p className="text-xs text-green-500 font-semibold mt-1">Normal</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Activity size={20} />
          </div>
        </div>
        {/* Memory */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Memory Usage</p>
            <p className="text-2xl font-bold text-gray-900">62%</p>
            <p className="text-xs text-green-500 font-semibold mt-1">Normal</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-brand-purple">
            <HardDrive size={20} />
          </div>
        </div>
        {/* Storage */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Storage Usage</p>
            <p className="text-2xl font-bold text-gray-900">68%</p>
            <p className="text-xs text-green-500 font-semibold mt-1">Normal</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Database size={20} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MiniChart data={timeData} dataKey="cpu"  color="#3B82F6" label="CPU Usage"     value={23} />
        <MiniChart data={timeData} dataKey="mem"  color="#8B75F5" label="Memory Usage"  value={62} />
        <MiniChart data={timeData} dataKey="net"  color="#10B981" label="Network Usage" value={43} />
        <MiniChart data={timeData} dataKey="disk" color="#F59E0B" label="Disk Usage"    value={68} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Services Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Services Status</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Uptime</th>
                <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                        <s.icon size={13} className="text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{s.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{s.uptime}</td>
                  <td className="py-3 text-sm text-gray-600">{s.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-4 text-xs font-semibold text-brand-purple hover:underline">View all services</button>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center flex-shrink-0`}>
                  <a.icon size={16} className={a.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 truncate">{a.desc}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs font-semibold text-brand-purple hover:underline">View all alerts</button>
        </div>
      </div>
    </div>
  );
}
