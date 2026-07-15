import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Landmark, Mail, AlertCircle, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDemoToken('');

    const res = await forgotPassword(email);
    if (res.success) {
      setSuccess('Reset token successfully generated!');
      if (res.resetToken) {
        setDemoToken(res.resetToken);
      }
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

        <h2 className="text-2xl font-bold text-white text-center">Reset Password</h2>
        <p className="text-xs text-darkbg-textMuted mt-1 mb-8 text-center">
          Enter your email to obtain a security reset token
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
            
            {demoToken && (
              <div className="bg-darkbg-pure border border-darkbg-border rounded-md p-3 mt-2 text-xs">
                <p className="text-darkbg-textMuted mb-2 font-mono">
                  [DEMO MODE] Copy token below to bypass mail configuration:
                </p>
                <div className="bg-darkbg-border text-white p-2 rounded select-all font-mono break-all font-semibold text-center tracking-wide">
                  {demoToken}
                </div>
                <Link
                  to={`/reset-password/${demoToken}`}
                  className="mt-3 text-brand-500 hover:text-brand-400 font-bold inline-flex items-center gap-1.5 justify-center w-full"
                >
                  Proceed to Reset Screen
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                Registered Email
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
                  placeholder="name@email.com"
                  className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 mt-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="text-sm text-darkbg-textMuted hover:text-white font-semibold inline-flex items-center gap-2 mt-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
