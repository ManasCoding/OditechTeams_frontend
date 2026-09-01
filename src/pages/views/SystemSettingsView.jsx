import React, { useState } from 'react';
import {
  Building2, Clock, Gift, Mail, MessageSquare, Settings2,
  Wrench, Save, Edit2, ChevronDown
} from 'lucide-react';

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
      value ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SectionCard = ({ title, icon: Icon, iconBg, children, onEdit, editLabel = 'Edit', editColor = 'text-brand-purple bg-purple-50 hover:bg-purple-100' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
    </div>
    <div className="flex-1">{children}</div>
    {onEdit && (
      <button
        onClick={onEdit}
        className={`mt-4 w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${editColor}`}
      >
        <Edit2 size={14} /> {editLabel}
      </button>
    )}
  </div>
);

const Field = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right ml-2">{value}</span>
  </div>
);

export default function SystemSettingsView() {
  // Company Info
  const [company, setCompany] = useState({
    name: 'Oditech Teams',
    email: 'info@oditechteams.com',
    phone: '+91 82499 73481',
    address: 'Nalco Square, Bhubaneswar,\nOdisha, India - 751023',
  });
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyDraft, setCompanyDraft] = useState(company);

  // Attendance
  const [attendance] = useState({
    workingHours: '09:30 AM - 06:30 PM',
    lateMarkingTime: '09:45 AM',
    halfDayThreshold: '04:00 Hours',
    absentMark: 'Absent',
    weekend: 'Sunday Only',
  });

  // Holiday Settings
  const [holiday, setHoliday] = useState({
    holidayColor: '#FFE4EC',
    weekendColor: '#E6F3FF',
    enableHolidayNotification: true,
    notifyEmail: true,
    notifySMS: true,
  });

  // Email Settings
  const [emailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    emailAddress: 'noreply@oditechteams.com',
    replyTo: 'support@oditechteams.com',
    ssl: true,
  });

  // SMS Settings
  const [smsSettings] = useState({
    accountSid: 'AC' + '*'.repeat(22),
    authToken: '*'.repeat(26),
    twilioNumber: '+14155238886',
    enableSMS: true,
  });

  // General Settings
  const [general] = useState({
    timezone: 'Asia/Kolkata (GMT+05:30)',
    dateFormat: 'DD MMM YYYY (27 Jul 2025)',
    timeFormat: '12 Hour (hh:mm AM/PM)',
    itemsPerPage: '10',
  });

  // Other Settings
  const [other, setOther] = useState({
    selfRegistration: false,
    emailVerification: true,
    attendanceRegularization: true,
    workReport: true,
    announcement: true,
    leaveModule: true,
    assetManagement: false,
    payrollModule: false,
    fileUploadReports: true,
  });

  const handleSaveCompany = () => {
    setCompany(companyDraft);
    setEditingCompany(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FD]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <span className="text-brand-purple font-medium cursor-pointer hover:underline">Dashboard</span>
            <span className="mx-1">›</span>
            <span>System Settings</span>
          </div>
          <p className="text-sm text-gray-400">Manage all system configurations and preferences</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-purple text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-md shadow-purple-200">
          <Save size={15} /> Save Changes
        </button>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-3 gap-5 mb-5">

        {/* Company Information */}
        <SectionCard
          title="Company Information"
          icon={Building2}
          iconBg="bg-brand-purple"
          onEdit={() => { setEditingCompany(true); setCompanyDraft(company); }}
          editLabel="Update Information"
          editColor="text-brand-purple bg-purple-50 hover:bg-purple-100"
        >
          {editingCompany ? (
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Company Name' },
                { key: 'email', label: 'Company Email' },
                { key: 'phone', label: 'Company Phone' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-purple"
                    value={companyDraft[key]}
                    onChange={e => setCompanyDraft(p => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Company Address</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-purple resize-none"
                  rows={2}
                  value={companyDraft.address}
                  onChange={e => setCompanyDraft(p => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveCompany} className="flex-1 bg-brand-purple text-white text-sm font-semibold py-2 rounded-lg hover:bg-purple-700 transition-colors">Save</button>
                <button onClick={() => setEditingCompany(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <Field label="Company Name" value={company.name} />
              <Field label="Company Email" value={company.email} />
              <Field label="Company Phone" value={company.phone} />
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-gray-500 flex-shrink-0">Company Address</span>
                <span className="text-sm font-medium text-gray-800 text-right ml-2 whitespace-pre-line">{company.address}</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Attendance Settings */}
        <SectionCard
          title="Attendance Settings"
          icon={Clock}
          iconBg="bg-emerald-500"
          onEdit={() => {}}
          editLabel="Edit Attendance Settings"
          editColor="text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
        >
          <Field label="Default Working Hours" value={attendance.workingHours} />
          <Field label="Late Marking Time" value={attendance.lateMarkingTime} />
          <Field label="Half Day Threshold" value={attendance.halfDayThreshold} />
          <Field label="Absent Mark (00)" value={attendance.absentMark} />
          <Field label="Weekend" value={attendance.weekend} />
        </SectionCard>

        {/* Holiday Settings */}
        <SectionCard
          title="Holiday Settings"
          icon={Gift}
          iconBg="bg-rose-400"
          onEdit={() => {}}
          editLabel="Edit Holiday Settings"
          editColor="text-rose-500 bg-rose-50 hover:bg-rose-100"
        >
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Holiday Color</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: holiday.holidayColor }} />
              <span className="text-sm font-medium text-gray-700">{holiday.holidayColor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Weekend Color</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: holiday.weekendColor }} />
              <span className="text-sm font-medium text-gray-700">{holiday.weekendColor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Enable Holiday Notification</span>
            <Toggle value={holiday.enableHolidayNotification} onChange={v => setHoliday(p => ({ ...p, enableHolidayNotification: v }))} />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Notify via Email</span>
            <Toggle value={holiday.notifyEmail} onChange={v => setHoliday(p => ({ ...p, notifyEmail: v }))} />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Notify via SMS</span>
            <Toggle value={holiday.notifySMS} onChange={v => setHoliday(p => ({ ...p, notifySMS: v }))} />
          </div>
        </SectionCard>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-3 gap-5 mb-5">

        {/* Email Settings */}
        <SectionCard
          title="Email Settings"
          icon={Mail}
          iconBg="bg-blue-500"
          onEdit={() => {}}
          editLabel="Edit Email Settings"
          editColor="text-blue-600 bg-blue-50 hover:bg-blue-100"
        >
          <Field label="SMTP Host" value={emailSettings.smtpHost} />
          <Field label="SMTP Port" value={emailSettings.smtpPort} />
          <Field label="Email Address" value={emailSettings.emailAddress} />
          <Field label="Reply To Email" value={emailSettings.replyTo} />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Secure Connection (SSL)</span>
            <Toggle value={emailSettings.ssl} onChange={() => {}} />
          </div>
        </SectionCard>

        {/* SMS Settings */}
        <SectionCard
          title="SMS Settings (Twilio)"
          icon={MessageSquare}
          iconBg="bg-amber-500"
          onEdit={() => {}}
          editLabel="Edit SMS Settings"
          editColor="text-amber-600 bg-amber-50 hover:bg-amber-100"
        >
          <Field label="Account SID" value={smsSettings.accountSid} />
          <Field label="Auth Token" value={smsSettings.authToken} />
          <Field label="Twilio Number" value={smsSettings.twilioNumber} />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Enable SMS</span>
            <Toggle value={smsSettings.enableSMS} onChange={() => {}} />
          </div>
        </SectionCard>

        {/* General Settings */}
        <SectionCard
          title="General Settings"
          icon={Settings2}
          iconBg="bg-gray-500"
          onEdit={() => {}}
          editLabel="Edit General Settings"
          editColor="text-gray-600 bg-gray-100 hover:bg-gray-200"
        >
          {[
            { label: 'System Timezone', value: general.timezone },
            { label: 'Date Format', value: general.dateFormat },
            { label: 'Time Format', value: general.timeFormat },
            { label: 'Items Per Page', value: general.itemsPerPage },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 ml-2">
                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{value}</span>
                <ChevronDown size={11} className="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Other Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Wrench size={18} className="text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Other Settings</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          {[
            { key: 'selfRegistration', label: 'Allow Employee Self Registration' },
            { key: 'emailVerification', label: 'Require Email Verification' },
            { key: 'attendanceRegularization', label: 'Allow Attendance Regularization' },
            { key: 'workReport', label: 'Enable Work Report' },
            { key: 'announcement', label: 'Enable Announcement' },
            { key: 'leaveModule', label: 'Enable Leave Module' },
            { key: 'assetManagement', label: 'Enable Asset Management' },
            { key: 'payrollModule', label: 'Enable Payroll Module' },
            { key: 'fileUploadReports', label: 'Enable File Upload in Reports' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={other[key]}
                onChange={() => setOther(p => ({ ...p, [key]: !p[key] }))}
                className="w-4 h-4 rounded accent-brand-purple cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 text-xs text-gray-400 px-1">
        <span>© 2025 <span className="text-brand-purple font-medium">Oditech Teams</span>. All rights reserved.</span>
        <span>Super Admin Panel v2.0.0</span>
      </div>
    </div>
  );
}
