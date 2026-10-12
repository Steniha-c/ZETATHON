import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        await register({ email, password, fullName, phone });
        navigate('/dashboard');
      } else {
        const loggedUser = await login({ email, password });
        if (loggedUser?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(from);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please type your registered email address first.');
      return;
    }
    try {
      const res = await api.forgotPassword(email);
      setInfoMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset instruction.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-story" aria-label="ZETATHON participant access">
          <div className="auth-story__brand">
            <img src="/zeta-logo.jpg" alt="" />
            <div><strong>ZETATHON</strong><small>ZETA • MONARCH LEVEL</small></div>
          </div>
          <div className="auth-story__body">
            <span className="auth-story__kicker">One arena · many ways forward</span>
            <h2>Make your next idea <span>count.</span></h2>
            <p>Sign in to follow your team’s registration and manage its project submission through the existing participant portal.</p>
          </div>
        </aside>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md auth-form-column"
      >
        <div className="text-center mb-6 space-y-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-cyan-400/50 p-0.5 bg-black mx-auto shadow-[0_0_30px_rgba(0,242,254,0.35)]">
            <img
              src="/zeta-logo.jpg"
              alt="ZETA Logo"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            SECURITY GATEWAY
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-white uppercase">
            {isRegisterMode ? 'CREATE ACCOUNT' : 'ZETATHON LOGIN'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isRegisterMode
              ? 'Join as an individual participant or team leader'
              : 'Access your team dashboard, timeline status, and submissions'}
          </p>
        </div>


        {/* Card Box */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500" />

          {/* Error / Info Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs flex items-center gap-2">
              <KeyRound className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@zetathon.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Password
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Create Account' : 'Authenticate & Enter'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
                setInfoMessage(null);
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-mono cursor-pointer"
            >
              {isRegisterMode
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Register Here"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
          >
            Looking to register your entire hackathon team? Click here.
          </Link>
        </div>
      </motion.div>
      </div>
    </div>
  );
};
