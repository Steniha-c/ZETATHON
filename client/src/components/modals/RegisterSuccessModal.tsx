import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Copy, ArrowRight, ShieldCheck, Clock, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team } from '../../types/index.js';
import { useNavigate } from 'react-router-dom';

interface RegisterSuccessModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
}

export const RegisterSuccessModal: React.FC<RegisterSuccessModalProps> = ({
  isOpen,
  team,
  onClose,
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen && !reduceMotion) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#77e7ed', '#a78bfa', '#8b5cf6', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen, reduceMotion]);

  if (!isOpen || !team) return null;

  const regId = team.registrationId || team.teamCode;

  const copyRegId = () => {
    navigator.clipboard.writeText(regId);
    alert('Registration ID copied to clipboard!');
  };

  const handleGoToLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0d1117] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,242,254,0.25)] z-10 text-center"
        >
          {/* Top border glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-500" />

          <div className={`registration-success-mark mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 ${reduceMotion ? 'motion-reduce' : ''}`}>
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Registration Submitted Successfully!
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Your <span className="text-cyan-400 font-bold font-mono">ZETATHON 2026</span> registration has been recorded.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border bg-amber-500/10 text-amber-300 border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Status: {team.status.replaceAll('_', ' ')}</span>
          </div>

          {/* Details Card */}
          <div className="mt-5 p-4 rounded-xl border border-white/10 bg-slate-900/60 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Team Name</span>
                <p className="text-base font-bold text-white font-mono">{team.name}</p>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                {team.challengeCode || 'Open Track'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Official Registration ID
                </span>
                <p className="text-lg font-black text-cyan-300 font-mono tracking-wider">{regId}</p>
              </div>
              <button
                onClick={copyRegId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
                title="Copy Registration ID"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>

            {team.pptFile && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-pink-400" />
                  Presentation PPT:
                </span>
                <strong className="text-pink-300 font-mono truncate max-w-[200px]">{team.pptFile.originalName}</strong>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Leader: <strong className="text-slate-200">{team.leaderName}</strong></span>
              <span>Total Members: <strong className="text-slate-200">{1 + (team.members?.length || 0)}</strong></span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 text-xs flex items-center gap-2 text-left">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Your team details and PPT pitch are securely stored in the hackathon registry. Please keep your Registration ID for check-in.</span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoToLogin}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)] cursor-pointer"
            >
              <span>Go To Dashboard Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
