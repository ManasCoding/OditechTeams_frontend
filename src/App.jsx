import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
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

  return (
    <div className="flex min-h-screen w-full bg-brand-bgLeft font-sans">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <svg width="70" height="55" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 hover:scale-105 transition-transform duration-300">
              {/* Left person */}
              <circle cx="16" cy="16" r="6" fill="#8B75F5" />
              <path d="M4 40C4 33.3726 9.37258 28 16 28H18C24.6274 28 30 33.3726 30 40V45H4V40Z" fill="#8B75F5" />
              
              {/* Right person */}
              <circle cx="44" cy="16" r="6" fill="#6C48F5" />
              <path d="M30 40C30 33.3726 35.3726 28 42 28H44C50.6274 28 56 33.3726 56 40V45H30V40Z" fill="#6C48F5" />
              
              {/* Center person */}
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

          <form className="w-full space-y-4" onSubmit={handleLogin}>
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
                <Eye size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[13px] pt-1 pb-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple/20 focus:ring-2 transition-all cursor-pointer accent-brand-purple" />
                </div>
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
              onClick={() => navigate('/admin-login')}
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
      
      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 relative bg-[#F4F2FF] items-center justify-center overflow-hidden border-l border-white/40 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-white/60 to-transparent rounded-full mix-blend-overlay filter blur-[80px] opacity-70 transform -rotate-12"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#E0DCFF] to-transparent rounded-full mix-blend-multiply filter blur-[60px] opacity-60"></div>
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 200C100 300 400 100 900 400" stroke="white" strokeWidth="2" />
            <path d="M-100 600C200 800 500 500 1000 700" stroke="white" strokeWidth="4" />
          </svg>
        </div>
        
        <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
          <img 
            src="/illustration.png" 
            alt="3D illustration of people working" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl hover:scale-[1.01] transition-transform duration-700 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
