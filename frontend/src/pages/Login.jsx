import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Mail, Lock, AlertCircle, ShieldCheck, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      const userRole = res.user?.role || 'Citizen';
      if (['Admin', 'Operator'].includes(userRole)) {
        navigate('/dashboard');
      } else {
        navigate('/navigation');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg-pure flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-darkbg-card border border-darkbg-border rounded-2xl shadow-glass p-8 flex flex-col items-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-4 text-brand-500">
          <Landmark className="h-6 w-6" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center">Welcome Back</h2>
        <p className="text-xs text-darkbg-textMuted mt-1 mb-8 text-center">
          Sign in to the Smart City Management Terminal
        </p>

        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 text-sm flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-darkbg-textMuted">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@smartcity.gov"
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-darkbg-textMuted">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-darkbg-textMuted mt-6 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 hover:text-brand-400 font-semibold underline">
            Register here
          </Link>
        </p>

        {/* Quick Login Options */}
        <div className="w-full mt-6 pt-6 border-t border-darkbg-border flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-darkbg-textMuted text-center uppercase tracking-wider mb-1">
            Demo Quick Login Options
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@smartcity.gov'); setPassword('password123'); }}
              className="bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:text-brand-300 font-semibold py-2 px-3 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => { setEmail('john.doe@gmail.com'); setPassword('password123'); }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold py-2 px-3 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <User className="h-4 w-4 shrink-0" />
              Citizen Portal
            </button>
          </div>
          <span className="text-[10px] text-darkbg-textMuted text-center font-mono mt-1">
            Password for all demo accounts: <code className="text-white">password123</code>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
