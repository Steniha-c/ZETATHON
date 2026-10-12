import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  sublabel?: string;
  accentColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon: Icon,
  sublabel,
  accentColor = 'cyan',
  index = 0,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState<string>('0');

  useEffect(() => {
    if (!isInView) return;

    // Check if numeric
    const rawStr = String(value);
    const numericMatch = rawStr.match(/(\d+)/);

    if (!numericMatch) {
      setDisplayValue(rawStr);
      return;
    }

    const targetNum = parseInt(numericMatch[1], 10);
    const prefix = rawStr.substring(0, numericMatch.index);
    const suffix = rawStr.substring((numericMatch.index || 0) + numericMatch[0].length);

    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (targetNum - start) * eased);

      const formatted = current < 10 && rawStr.includes('0') ? `0${current}` : `${current}`;
      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayValue(rawStr);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [isInView, value]);

  const colorMap = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      glow: 'hover:shadow-[0_0_25px_rgba(0,242,254,0.15)]',
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      glow: 'hover:shadow-[0_0_25px_rgba(121,40,202,0.15)]',
      text: 'text-purple-400',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      text: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  };

  const scheme = colorMap[accentColor];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-300 ${scheme.border} ${scheme.glow}`}
    >
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-400 transition-all" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              {displayValue}
            </span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500">
              {sublabel}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.badge}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Futuristic corner mark */}
      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors blur-xl" />
    </motion.div>
  );
};
