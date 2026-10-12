import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string; // ISO date string
  startDate?: string;
  className?: string;
  showLabels?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  status: 'upcoming' | 'live' | 'ended';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  startDate,
  className = '',
  showLabels = true,
}) => {
  const calculateTime = (): TimeRemaining => {
    const target = new Date(targetDate).getTime();
    const start = startDate ? new Date(startDate).getTime() : target;
    const now = Date.now();

    if (now >= target) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, status: 'ended' };
    }

    if (startDate && now >= start && now < target) {
      const diff = target - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      return { days, hours, minutes, seconds, total: diff, status: 'live' };
    }

    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, total: diff, status: 'upcoming' };
  };

  const [time, setTime] = useState<TimeRemaining>(calculateTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, startDate]);

  if (time.status === 'ended') {
    return (
      <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 font-mono text-sm uppercase tracking-widest ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span>SUBMISSIONS CLOSED • EVALUATION IN PROGRESS</span>
      </div>
    );
  }

  if (time.status === 'live') {
    return (
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-4 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          HACKATHON IS LIVE • 8-HOUR SPRINT UNDERWAY
        </div>
        <div className={`grid grid-cols-4 gap-2 sm:gap-4 ${className}`}>
          <TimeBox value={time.days} label="Days" showLabel={showLabels} />
          <TimeBox value={time.hours} label="Hours" showLabel={showLabels} />
          <TimeBox value={time.minutes} label="Mins" showLabel={showLabels} />
          <TimeBox value={time.seconds} label="Secs" showLabel={showLabels} highlight />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 ${className}`}>
      <TimeBox value={time.days} label="Days" showLabel={showLabels} />
      <TimeBox value={time.hours} label="Hours" showLabel={showLabels} />
      <TimeBox value={time.minutes} label="Mins" showLabel={showLabels} />
      <TimeBox value={time.seconds} label="Secs" showLabel={showLabels} highlight />
    </div>
  );
};

const TimeBox: React.FC<{
  value: number;
  label: string;
  showLabel?: boolean;
  highlight?: boolean;
}> = ({ value, label, showLabel = true, highlight = false }) => {
  const formatted = String(value).padStart(2, '0');

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border ${
        highlight
          ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
          : 'border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg shadow-black/40'
      }`}
    >
      {/* Corner tech accents */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400/60" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400/60" />

      <span className={`text-2xl sm:text-4xl md:text-5xl font-extrabold font-mono tracking-tight ${highlight ? 'text-cyan-300' : 'text-white'}`}>
        {formatted}
      </span>
      {showLabel && (
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
          {label}
        </span>
      )}
    </motion.div>
  );
};
