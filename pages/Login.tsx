
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBranchStore } from '../store';
import { HeartPulse } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@parami.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email);
      
      // Auto-select branch if user is restricted
      const user = useAuthStore.getState().user;
      if (user?.branchId) {
          useBranchStore.getState().setBranch(user.branchId);
      }
      
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Red Top Half */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-parami-500"></div>
      
      {/* White Bottom Half */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white"></div>

      <style>{`
        /* Button glow effect */
        .sign-in-btn {
          background-color: #D7000F;
          box-shadow: 0 4px 20px rgba(215, 0, 15, 0.15);
        }

        .sign-in-btn:hover {
          background-color: #be123c;
          box-shadow: 0 10px 30px rgba(215, 0, 15, 0.3);
          transform: translateY(-2px);
        }

        /* Input focus glow */
        .login-input:focus {
          border-color: #D7000F;
          box-shadow: 0 0 0 4px rgba(215, 0, 15, 0.1);
        }

        /* Checkbox custom color */
        .custom-checkbox {
          accent-color: #D7000F;
        }
        .custom-checkbox:checked {
          background-color: #D7000F;
          border-color: #D7000F;
        }

        /* Smooth animations */
        * {
          transition: all 200ms ease;
        }
      `}</style>
      
      {/* Card Container */}
      <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl z-10 overflow-hidden relative animate-in fade-in zoom-in-95 duration-300 p-12 border border-gray-100">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
           <div className="w-20 h-20 bg-parami-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 mx-auto transform hover:scale-105 transition-transform duration-300">
             <span className="font-bold text-4xl tracking-tighter">A7</span>
           </div>
           <h1 className="text-[32px] font-bold text-gray-900 font-sans leading-tight tracking-tight mb-1">Smart POS</h1>
           <p className="text-gray-500 font-medium text-base tracking-wide">System Login</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-5">
               <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Email Address</label>
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="admin@parami.com" 
                     className="w-full h-[52px] px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all font-medium text-base login-input"
                     required
                   />
               </div>
               <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Password</label>
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••" 
                     className="w-full h-[52px] px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all font-medium text-base login-input"
                     required
                   />
               </div>
           </div>
           
           <div className="flex items-center justify-between pt-1">
             <label className="flex items-center gap-2 cursor-pointer select-none group">
               <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-parami-500 focus:ring-parami-500 custom-checkbox transition-all cursor-pointer group-hover:border-parami-500" 
               />
               <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Remember me</span>
             </label>
             <a href="#" className="text-sm font-medium text-parami-500 hover:text-parami-600 hover:underline transition-colors">Forgot password?</a>
           </div>

           <button 
             type="submit" 
             className="w-full h-[52px] sign-in-btn text-white font-semibold rounded-xl active:scale-98 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed text-base tracking-wide flex items-center justify-center transform hover:-translate-y-0.5"
             disabled={loading}
           >
             {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                </span>
             ) : 'Sign In'}
           </button>
        </form>

        <div className="mt-12 text-center space-y-1.5 border-t border-gray-100 pt-6">
           <p className="text-xs text-gray-400 font-medium">
              Powered by <span className="text-gray-600 font-bold">A7 Systems</span>
           </p>
           <p className="text-[10px] text-gray-400">© 2025 A7 Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
