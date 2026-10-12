import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(0,242,254,0.3)]" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            AUTHENTICATING ZETATHON SECURITY...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center bg-[#07090e] text-white">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-500/30 bg-slate-900/80 backdrop-blur-xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
              403 FORBIDDEN
            </span>
            <h2 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are logged in as <strong className="text-slate-200">{user?.email}</strong> with role <strong className="text-cyan-400">{user?.role}</strong>. Administrative console access is restricted to verified event organizers.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase text-black bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Participant Dashboard
            </Link>
            <button
              onClick={logout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase text-slate-300 border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
