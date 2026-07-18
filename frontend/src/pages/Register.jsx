import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password, role);
    if (res.success) {
      const userRole = res.user?.role || role;
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
        
        <h2 className="text-2xl font-bold text-white text-center">Create Account</h2>
        <p className="text-xs text-darkbg-textMuted mt-1 mb-8 text-center">
          Register new terminal operator or citizen profile
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
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-darkbg-textMuted">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

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
                placeholder="johndoe@email.com"
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
              Terminal Access Level
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-darkbg-textMuted">
                <Shield className="h-5 w-5" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors appearance-none"
              >
                <option value="Citizen">Citizen (Standard Access)</option>
                <option value="Visitor">Visitor (Temporary Access)</option>
                <option value="Operator">Operator (Control Operations)</option>
                <option value="Admin">Admin (Full Orchestration)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-darkbg-textMuted mt-8">
          Already registered?{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-400 font-semibold underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
