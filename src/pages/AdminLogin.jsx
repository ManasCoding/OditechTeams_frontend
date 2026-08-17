import API_URL from '../../../../../../../../api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !secretKey) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, secretKey })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        // Navigate to dashboard if login is successful
        navigate('/dashboard', { state: { isAdmin: true, user: data.user } });
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans flex bg-[#0F0A24]" style={{ backgroundImage: 'radial-gradient(ellipse at 60% 0%, #2D1B6B 0%, #0F0A24 60%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-16 overflow-hidden">
        {/* Glowing grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,117,245,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,117,245,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Shield icon */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-purple to-blue-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-900">
            <Shield size={44} className="text-white" />
          </div>

          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Admin Control<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
              Center
            </span>
          </h2>
          <p className="text-purple-200/70 text-base leading-relaxed mb-10">
            Secure access to the OditechTeams administration panel. Manage users, roles, system health and more.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {['User Management', 'Role Control', 'System Monitor', 'Audit Logs'].map(f => (
              <span key={f} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/10 text-purple-200 text-xs font-semibold rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md">

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-purple-300/70 hover:text-purple-200 text-sm font-medium mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to regular login
          </button>

          {/* Card */}
          <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-purple to-blue-500 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Login</h1>
                <p className="text-purple-300/60 text-xs">Restricted — Authorized Personnel Only</p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl mb-5">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-purple-200/60 mb-1.5 uppercase tracking-wider">Admin Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                  <input
                    type="email"
                    placeholder="admin@oditech.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/[0.07] border border-white/10 text-white placeholder-purple-300/30 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-purple-200/60 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/[0.07] border border-white/10 text-white placeholder-purple-300/30 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Secret Admin Key */}
              <div>
                <label className="block text-xs font-semibold text-purple-200/60 mb-1.5 uppercase tracking-wider">
                  Secret Admin Key
                  <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full normal-case tracking-normal font-medium">Required</span>
                </label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="Enter secret admin key"
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    className="w-full bg-white/[0.07] border border-white/10 text-white placeholder-purple-300/30 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-brand-purple/60 focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors"
                  >
                    {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-purple-300/40 mt-1.5">Contact your system administrator if you don't have this key.</p>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded accent-brand-purple cursor-pointer" />
                  <span className="text-xs text-purple-300/60 group-hover:text-purple-200 transition-colors">Remember this device</span>
                </label>
                <a href="#" className="text-xs text-brand-purple hover:text-purple-400 font-semibold transition-colors">Forgot password?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-brand-purple to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 hover:-translate-y-[1px] active:translate-y-0 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying credentials...
                  </>
                ) : (
                  <>
                    <Shield size={16} /> Sign in as Admin
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-yellow-400/70 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-300/50 leading-relaxed">
                This is a secured admin portal. All login attempts are logged and monitored. Unauthorized access is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-purple-300/30 text-xs mt-6">
            © 2026 OditechTeams. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
