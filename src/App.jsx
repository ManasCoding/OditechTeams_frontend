import API_URL from './api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();

  // Mode state
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Admin specific state
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // User Login Handler
  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard', { state: { isAdmin: false, user: data.user } });
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!email || !password || !secretKey) {
      setAdminError('All fields are required.');
      return;
    }

    setAdminLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, secretKey })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard', { state: { isAdmin: true, user: data.user } });
      } else {
        setAdminError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setAdminError('Failed to connect to the server. Please try again later.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full font-sans transition-colors duration-1000 overflow-hidden relative ${isAdminMode ? 'bg-[#0F0A24]' : 'bg-brand-bgLeft'}`} 
      style={isAdminMode ? { backgroundImage: 'radial-gradient(ellipse at 50% 0%, #2D1B6B 0%, #0F0A24 60%)' } : {}}
    >
      <div className="relative flex w-full min-h-screen overflow-hidden max-w-[1920px] mx-auto">

        {/* ─── IMAGE / INFO PANEL (Slides left & right) ─── */}
        <div 
          className={`hidden lg:flex absolute top-0 bottom-0 w-1/2 transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] z-20 flex-col items-center justify-center shadow-2xl ${isAdminMode ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Base background covers opposite side */}
          <div className="absolute inset-0 bg-[#F4F2FF] transition-opacity duration-1000" style={{ opacity: isAdminMode ? 0 : 1 }}>
             <div className="absolute top-[-5%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-white/60 to-transparent rounded-full mix-blend-overlay filter blur-[80px] opacity-70 transform -rotate-12"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#E0DCFF] to-transparent rounded-full mix-blend-multiply filter blur-[60px] opacity-60"></div>
          </div>

          {/* Admin decorative background */}
          <div className="absolute inset-0 transition-opacity duration-1000 overflow-hidden" style={{ opacity: isAdminMode ? 1 : 0 }}>
             <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
             <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
             <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: 'linear-gradient(rgba(139,117,245,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,117,245,0.4) 1px, transparent 1px)',
                 backgroundSize: '60px 60px'
               }}
             />
          </div>

          {/* User Mode Image */}
          <div className={`relative z-10 w-full h-full flex items-center justify-center p-8 transition-all duration-700 absolute inset-0 ${isAdminMode ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 delay-300'}`}>
            <img 
              src="/illustration.png" 
              alt="3D illustration of people working" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Admin Mode Info */}
          <div className={`relative z-10 max-w-md text-center transition-all duration-700 absolute ${isAdminMode ? 'opacity-100 scale-100 delay-300' : 'opacity-0 scale-90 pointer-events-none'}`}>
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

        {/* ─── FORMS PANEL (Slides right & left) ─── */}
        <div 
          className={`absolute top-0 bottom-0 w-full lg:w-1/2 transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] z-10 flex flex-col items-center justify-center ${isAdminMode ? 'translate-x-0 lg:translate-x-full' : 'translate-x-0'}`}
        >

          {/* --- User Login Form --- */}
          <div className={`absolute w-full px-8 lg:px-12 flex flex-col items-center transition-all duration-700 ${isAdminMode ? 'opacity-0 pointer-events-none -translate-x-8 lg:translate-x-8' : 'opacity-100 translate-x-0 delay-300'}`}>
            <div className="w-full max-w-md flex flex-col items-center">
              
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <svg width="70" height="55" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 hover:scale-105 transition-transform duration-300">
                  <circle cx="16" cy="16" r="6" fill="#8B75F5" />
                  <path d="M4 40C4 33.3726 9.37258 28 16 28H18C24.6274 28 30 33.3726 30 40V45H4V40Z" fill="#8B75F5" />
                  <circle cx="44" cy="16" r="6" fill="#6C48F5" />
                  <path d="M30 40C30 33.3726 35.3726 28 42 28H44C50.6274 28 56 33.3726 56 40V45H30V40Z" fill="#6C48F5" />
                  <rect x="22" y="8" width="16" height="36" rx="8" fill="#3582FB" stroke="white" strokeWidth="2.5" />
                  <circle cx="30" cy="17" r="3.5" fill="white" />
                  <path d="M25.5 35C25.5 31.6863 27.8137 29 30 29C32.1863 29 34.5 31.6863 34.5 35V39H25.5V35Z" fill="white" />
                </svg>
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight flex items-center">
                  Oditech<span className="text-brand-purple">Teams</span>
                </h1>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-[22px] font-bold text-gray-900 mb-1 flex items-center justify-center gap-1">
                  Welcome Back! <span className="inline-block origin-bottom hover:rotate-12 transition-transform duration-300">👋</span>
                </h2>
                <p className="text-gray-500 text-[15px]">Sign in to continue to your workspace</p>
              </div>

              <form className="w-full space-y-4" onSubmit={handleUserLogin}>
                <div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  />
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all pr-12 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[13px] pt-1 pb-1">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple/20 focus:ring-2 transition-all cursor-pointer accent-brand-purple" />
                    <span className="text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-brand-purple font-semibold hover:text-purple-700 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-purple hover:bg-[#5B3CE0] text-white font-medium py-3 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(108,72,245,0.39)] hover:shadow-[0_6px_20px_rgba(108,72,245,0.23)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none text-[15px]"
                >
                  Login
                </button>
                
                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-[13px]">or continue with</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsAdminMode(true)}
                  className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:-translate-y-[1px] text-[15px]"
                >
                  <span>Admin Login</span>
                </button>
              </form>

              <p className="mt-8 text-gray-500 text-[14px]">
                Need access? <a href="mailto:hr@oditech.com" className="text-brand-purple font-semibold hover:text-purple-700 transition-colors ml-1">Contact HR</a>
              </p>
            </div>
          </div>

          {/* --- Admin Login Form --- */}
          <div className={`absolute w-full px-8 lg:px-16 flex flex-col items-center transition-all duration-700 ${isAdminMode ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 pointer-events-none translate-x-8 lg:-translate-x-8'}`}>
            <div className="w-full max-w-md">

              <button
                type="button"
                onClick={() => setIsAdminMode(false)}
                className="flex items-center gap-2 text-purple-300/70 hover:text-purple-200 text-sm font-medium mb-8 transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to regular login
              </button>

              <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-purple to-blue-500 flex items-center justify-center shadow-lg shadow-purple-900/50">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Admin Login</h1>
                    <p className="text-purple-300/60 text-xs">Restricted — Authorized Personnel Only</p>
                  </div>
                </div>

                {adminError && (
                  <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl mb-5">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    {adminError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
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
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full mt-2 bg-gradient-to-r from-brand-purple to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 hover:-translate-y-[1px] active:translate-y-0 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {adminLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield size={16} /> Sign in as Admin
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
