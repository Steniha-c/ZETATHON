import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Code, Award, Layers, ArrowRight } from 'lucide-react';
import { Challenge } from '../../types/index.js';
import { useNavigate } from 'react-router-dom';

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!challenge) return null;

  const difficultyColors = {
    Beginner: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
    Intermediate: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    Advanced: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
  };

  const handleRegisterWithChallenge = () => {
    onClose();
    navigate(`/register?challenge=${challenge.id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl rounded-2xl border border-cyan-500/30 bg-[#0d1117] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,242,254,0.15)] my-8 z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-3 pr-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {challenge.code}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                  {challenge.category}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-md border ${difficultyColors[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {challenge.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {challenge.description}
              </p>
            </div>

            {/* Background / Problem Context */}
            {challenge.background && (
              <div className="mt-6 p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  <Layers className="w-4 h-4" />
                  Background & Problem Statement Context
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {challenge.background}
                </p>
              </div>
            )}

            {/* Deliverables */}
            <div className="mt-6 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                Expected Deliverables (8-Hour Sprint)
              </h4>
              <ul className="space-y-2">
                {challenge.deliverables?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Suggestions */}
            <div className="mt-6 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                <Code className="w-4 h-4 text-indigo-400" />
                Suggested Tech Stacks & Tools
              </h4>
              <div className="flex flex-wrap gap-2">
                {challenge.techSuggestions?.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-white/5 border border-white/10 text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="mt-6 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                <Award className="w-4 h-4 text-amber-400" />
                Judging Rubric Weights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {challenge.evaluationCriteria?.map((rubric, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-white/5 bg-slate-900/30 text-xs text-slate-400">
                    {rubric}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-mono">
                Challenge ID: {challenge.id}
              </span>

              <button
                onClick={handleRegisterWithChallenge}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              >
                <span>Select & Register With This Track</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
