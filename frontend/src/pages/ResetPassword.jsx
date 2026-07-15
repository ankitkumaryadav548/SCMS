import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, password);
    if (res.success) {
      setSuccess('Your password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-darkbg-pure flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-darkbg-card border border-darkbg-border rounded-2xl shadow-glass p-8 flex flex-col items-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-4 text-brand-500">
          <Landmark className="h-6 w-6" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center">New Password</h2>
        <p className="text-xs text-darkbg-textMuted mt-1 mb-8 text-center">
          Enter and confirm your new account password
        </p>

        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 text-sm flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-emerald-400 text-sm flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
            <p className="text-xs text-emerald-500/80 mt-1">
              Redirecting you to the login screen in a few seconds...
            </p>
            <Link
              to="/login"
              className="mt-3 text-white font-bold inline-flex items-center gap-1 hover:underline text-xs"
            >
              Go immediately
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                New Password
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
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-darkbg-textMuted">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-4 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
