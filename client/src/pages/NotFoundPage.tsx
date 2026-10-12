import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center text-center relative z-10 not-found-page">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
          <Terminal className="w-8 h-8" />
        </div>

        <h1 className="text-6xl font-black font-mono text-white tracking-tighter">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase text-slate-200 font-mono">
            COORDINATE NOT FOUND
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The target route does not exist on the ZETATHON platform or has been relocated by organizers.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Mission Control</span>
        </Link>
      </div>
    </div>
  );
};
