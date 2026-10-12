import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock, Users, Target, Trophy, ArrowRight, Sparkles, Code, Cpu,
  CheckCircle, ChevronDown, Layers, Terminal, Shield, Zap, Search,
  Calendar, Flame, Bell, Eye, ChevronRight, ChevronLeft
} from 'lucide-react';
import { HACKATHON_CONFIG, HackathonConfig, Challenge } from '../hackathon.config.js';
import { CountdownTimer } from '../components/common/CountdownTimer.js';
import { StatCard } from '../components/common/StatCard.js';
import { SectionHeader } from '../components/common/SectionHeader.js';
import { ChallengeDetailModal } from '../components/modals/ChallengeDetailModal.js';
import { api } from '../services/api.js';

export const HomePage: React.FC = () => {
  const [config, setConfig] = useState<HackathonConfig>(HACKATHON_CONFIG);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActivePhaseIndex((prev) => (prev + 1) % (config.timeline?.length || 6));
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, config.timeline?.length]);

  useEffect(() => {
    // Fetch live config and announcements from server
    const loadData = async () => {
      try {
        const liveCfg = await api.getConfig();
        if (liveCfg) setConfig(liveCfg);
        const liveAnn = await api.getAnnouncements();
        if (liveAnn) setAnnouncements(liveAnn);
      } catch (e) {
        // Fallback to initial config
      }
    };
    loadData();
  }, []);

  const importantAnnouncement = announcements.find(a => a.isImportant);

  return (
    <div className="relative min-h-screen">
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative min-h-[95vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Important Announcement Ticker if present */}
        {importantAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm text-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.15)]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="p-1 rounded bg-cyan-400 text-black font-bold uppercase text-[10px] tracking-wider shrink-0">
                Notice
              </span>
              <span className="font-semibold text-white shrink-0">{importantAnnouncement.title}:</span>
              <span className="truncate text-slate-300">{importantAnnouncement.content}</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono shrink-0 hidden sm:inline">
              LIVE BROADCAST
            </span>
          </motion.div>
        )}

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {/* Futuristic Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {config.dates.duration} SPRINT
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-950/30 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              INTERNAL HACKATHON
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider">
              ORGANIZED BY {config.organizer}
            </span>
          </motion.div>

          {/* Official Emblem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center pt-2"
          >
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-cyan-400/50 p-1 bg-black shadow-[0_0_40px_rgba(0,242,254,0.4)] group-hover:shadow-[0_0_60px_rgba(0,242,254,0.7)] group-hover:scale-105 transition-all duration-300">
                <img
                  src="/zeta-logo.jpg"
                  alt="ZETA Monarch Level"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-25 blur-xl group-hover:opacity-50 transition-opacity pointer-events-none" />
            </div>
          </motion.div>

          {/* Main Title Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tighter text-white uppercase select-none">
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_35px_rgba(0,242,254,0.3)]">
                {config.name}
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 font-sans uppercase">
              "{config.tagline}"
            </p>
          </motion.div>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal"
          >
            {config.description}
          </motion.p>

          {/* Glowing Date Flashcard */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 pb-2 w-full max-w-xl mx-auto"
          >
            <div className="relative group">
              {/* Pulsing ambient glowing aura */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-purple-500/40 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

              {/* Glowing Card Surface */}
              <div className="relative px-6 py-6 sm:px-8 sm:py-7 rounded-2xl sm:rounded-3xl border border-cyan-400/50 bg-gradient-to-b from-[#0c1829]/95 via-[#09111f]/95 to-[#07090e]/98 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,254,0.3),inset_0_0_30px_rgba(0,242,254,0.1)] flex flex-col items-center text-center">
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-3.5 shadow-[0_0_15px_rgba(0,242,254,0.25)]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SCHEDULE UPDATE</span>
                </div>

                {/* Main Glowing Headline */}
                <h3 className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-wider uppercase drop-shadow-[0_2px_15px_rgba(0,242,254,0.45)]">
                  DATE ANNOUNCEMENT COMING SOON
                </h3>

                {/* Subtitle Message */}
                <p className="text-xs sm:text-sm text-slate-300 font-mono tracking-wide mt-2.5 max-w-md leading-relaxed">
                  <span className="text-amber-400 font-bold">⚡ Squad Registration is LIVE!</span> Official hackathon sprint dates will be broadcasted shortly.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-sm font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(0,242,254,0.4)] hover:shadow-[0_0_45px_rgba(0,242,254,0.6)] active:scale-95"
            >
              <span>REGISTER NOW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-sm font-semibold uppercase tracking-wider text-slate-200 border border-white/10 hover:border-cyan-500/40 hover:bg-white/5 transition-all"
            >
              <span>EXPLORE ZETATHON</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. HACKATHON STATS */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-[#07090e]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              value={`${config.stats.hours}`}
              label="Sprint Hours"
              sublabel="Non-stop prototyping sprint"
              icon={Clock}
              accentColor="cyan"
              index={0}
            />
            <StatCard
              value={config.stats.teams}
              label="Selected Teams"
              sublabel="Hand-picked student syndicates"
              icon={Users}
              accentColor="purple"
              index={1}
            />
            <StatCard
              value={config.stats.challenges}
              label="Hackathon Track"
              sublabel="100% Open Innovation & Freedom"
              icon={Target}
              accentColor="emerald"
              index={2}
            />
            <StatCard
              value={config.stats.prizePool}
              label="Prize Pool"
              sublabel="Cash, trophies, incubation perks"
              icon={Trophy}
              accentColor="amber"
              index={3}
            />
          </div>
        </div>
      </section>

      {/* 3. ABOUT ZETATHON */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="About The Sprint"
            title="WHAT IS"
            highlight="ZETATHON?"
            subtitle="An internal 8-hour hackathon organized by ZETA to encourage students to transform ideas into working prototypes through collaboration, creativity, and technology."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Card 1: BUILD */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-8 backdrop-blur-md hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-white uppercase mb-3">
                BUILD
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Turn ideas into working prototypes. In just 8 hours, build a functional, deployable project that demonstrates core feasibility and architectural elegance.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Zero pre-built code allowed</span>
              </div>
            </motion.div>

            {/* Card 2: COLLABORATE */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative rounded-2xl border border-purple-500/20 bg-slate-900/40 p-8 backdrop-blur-md hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(121,40,202,0.15)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-white uppercase mb-3">
                COLLABORATE
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Work together, learn from each other, and solve problems as a team. Sync your skills across frontend, backend, IoT, AI, and UX design to deliver impact.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>2-4 members per team</span>
              </div>
            </motion.div>

            {/* Card 3: INNOVATE */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative rounded-2xl border border-indigo-500/20 bg-slate-900/40 p-8 backdrop-blur-md hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-white uppercase mb-3">
                INNOVATE
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create meaningful technology-driven solutions. Address real university friction, societal sustainability, and frontier technology challenges.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Mentors on-site for review</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. OPEN INNOVATION TRACK */}
      <section id="challenges" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#06080d]/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader
            badge="Open Innovation"
            title="THE"
            highlight="TRACK"
            subtitle="No restricted problem statements. ZETATHON 2026 is 100% Open Innovation — build any high-impact solution solving real-world challenges across any domain."
          />

          {/* Main Open Innovation Showcase Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-black/80 p-8 sm:p-12 backdrop-blur-xl shadow-[0_0_50px_rgba(0,242,254,0.1)] overflow-hidden"
          >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    OPEN-INNOVATION
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/30 text-purple-300">
                    Universal Track
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-300">
                    All Tech Stacks
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  8-Hour Sprint
                </span>
              </div>

              <div className="max-w-3xl space-y-3">
                <h3 className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white uppercase">
                  Complete Creative Freedom. Zero Limits.
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  ZETATHON 2026 removes all rigid problem statement constraints. You and your squad have total autonomy to identify a real-world friction, conceptualize a disruptive solution, and engineer a working prototype within the 8-hour sprint.
                </p>
              </div>

              {/* Suggested Domains Grid */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Recommended Innovation Domains (Build in Any Field)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'AI & Generative Agents', desc: 'LLMs, RAG, autonomous agents, computer vision, multimodal intelligence.', tag: 'AI/ML' },
                    { title: 'Web3 & Fintech', desc: 'Decentralized systems, smart contracts, digital escrow, campus micro-economies.', tag: 'FinTech' },
                    { title: 'Cybersecurity & Cloud', desc: 'Zero-trust architecture, threat defense, automated dev tooling, cloud infra.', tag: 'Cyber' },
                    { title: 'HealthTech & Wellness', desc: 'Medical diagnostics, student wellness, accessibility bridges, bio telemetry.', tag: 'Health' },
                    { title: 'CleanTech & Sustainability', desc: 'Carbon footprints, renewable energy, waste auditing, eco-incentives.', tag: 'GreenTech' },
                    { title: 'IoT & Smart Automation', desc: 'Embedded robotics, sensor telemetrics, campus automation, hardware.', tag: 'IoT' },
                  ].map((domain, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white font-mono">{domain.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                          {domain.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{domain.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables & Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Key Deliverables Required
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Working Prototype:</strong> Functional code or proof-of-concept demonstrated live.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Presentation Deck (PPT/PDF):</strong> Overview of the problem, solution architecture, stack, and impact.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>GitHub Repository:</strong> Clean codebase with commit activity and README documentation.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Evaluation Criteria
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">30%</span>
                      <p className="font-bold text-white">Innovation & Novelty</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">30%</span>
                      <p className="font-bold text-white">Working Prototype</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">25%</span>
                      <p className="font-bold text-white">Practical Utility & Impact</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">15%</span>
                      <p className="font-bold text-white">Pitch & Presentation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedChallenge(config.challenges[0] || null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-slate-300 border border-white/10 hover:border-cyan-500/40 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>View Track Details</span>
                </button>

                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(0,242,254,0.4)] cursor-pointer"
                >
                  <span>Register Squad For Open Innovation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. TIMELINE / JOURNEY */}
      <section id="timeline" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="The Timeline"
            title="THE"
            highlight="TIMELINE"
            subtitle="Follow the structured roadmap from early bird registration to the 48-hour sprint and grand awards."
          />

          {/* DESKTOP RADIAL ORBITAL TIMELINE (lg and above) */}
          <div
            className="hidden lg:block relative w-full max-w-6xl mx-auto h-[680px] my-10 select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* SVG Connecting Lines & Anchor Nodes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox="-550 -340 1100 680"
            >
              <defs>
                <linearGradient id="goldLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <filter id="glowFilterGold" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowFilterCyan" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting Lines for each phase */}
              {(config.timeline || []).map((phase, idx) => {
                const angle = (2 * Math.PI * idx) / 6 - Math.PI / 2;
                const centerRadius = 180;
                const radiusX = 425;
                const radiusY = 265;
                const innerX = Math.round(Math.cos(angle) * centerRadius);
                const innerY = Math.round(Math.sin(angle) * centerRadius);
                const outerX = Math.round(Math.cos(angle) * radiusX);
                const outerY = Math.round(Math.sin(angle) * radiusY);

                const isSelected = activePhaseIndex === idx;

                return (
                  <g key={phase.id || idx}>
                    {/* Radial Connecting Line */}
                    <line
                      x1={innerX}
                      y1={innerY}
                      x2={outerX}
                      y2={outerY}
                      stroke={
                        isSelected
                          ? 'url(#cyanLineGrad)'
                          : 'rgba(56, 189, 248, 0.22)'
                      }
                      strokeWidth={isSelected ? 3.5 : 1.5}
                      strokeDasharray={isSelected ? 'none' : '4 4'}
                      filter={isSelected ? 'url(#glowFilterCyan)' : undefined}
                      className="transition-all duration-300"
                    />

                    {/* Inner Anchor Dot on Hub Perimeter */}
                    <circle
                      cx={innerX}
                      cy={innerY}
                      r={isSelected ? 5 : 3}
                      fill={isSelected ? '#00f2fe' : 'rgba(148, 163, 184, 0.5)'}
                      className="transition-all duration-300"
                    />

                    {/* Outer Anchor Dot near Card */}
                    <circle
                      cx={outerX}
                      cy={outerY}
                      r={isSelected ? 6 : 3.5}
                      fill={isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>

            {/* CENTER ORBITAL HUB (Center Circle) */}
            {(() => {
              const currentPhase = config.timeline[activePhaseIndex] || config.timeline[0];

              return (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full flex flex-col items-center justify-center p-8 text-center transition-all duration-500 z-10 border-[3px] border-cyan-400/90 shadow-[0_0_70px_rgba(0,242,254,0.35),inset_0_0_45px_rgba(0,242,254,0.18)] bg-gradient-to-b from-[#0c1829]/95 via-[#09111f]/95 to-[#07090e]/98 backdrop-blur-2xl"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPhase?.id || activePhaseIndex}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="flex flex-col items-center justify-center w-full"
                    >
                      {/* Phase Tag & Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-black tracking-widest uppercase text-cyan-400">
                          {currentPhase?.phaseId || `PHASE 0${activePhaseIndex + 1}`}
                        </span>
                        {currentPhase?.badge && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                            {currentPhase.badge}
                          </span>
                        )}
                      </div>

                      {/* Main Title */}
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-tight mb-3 px-2">
                        {currentPhase?.title}
                      </h3>

                      {/* Glowing Gradient Divider */}
                      <div className="w-28 h-[2px] mb-3 transition-colors duration-300 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 max-w-[245px] leading-relaxed">
                        {currentPhase?.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* 6 RADIAL PHASE CARDS IN ORBIT */}
            {(config.timeline || []).map((phase, idx) => {
              const angle = (2 * Math.PI * idx) / 6 - Math.PI / 2;
              const radiusX = 425;
              const radiusY = 265;
              const x = Math.round(Math.cos(angle) * radiusX);
              const y = Math.round(Math.sin(angle) * radiusY);

              const isSelected = activePhaseIndex === idx;

              return (
                <div
                  key={phase.id || idx}
                  onClick={() => setActivePhaseIndex(idx)}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-72 rounded-3xl p-5 cursor-pointer transition-all duration-300 z-20 select-none group ${
                    isSelected
                      ? 'bg-white text-slate-900 ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(0,242,254,0.5)] scale-105'
                      : 'bg-white/95 hover:bg-white text-slate-900 border border-white/80 hover:border-cyan-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:scale-102'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-black tracking-wider uppercase text-cyan-600">
                      {phase.phaseId || `PHASE 0${idx + 1}`}
                    </span>
                    {phase.badge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 uppercase tracking-wider">
                        {phase.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-cyan-600 font-bold' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                  <h4 className="text-base font-bold tracking-tight leading-snug text-slate-900">
                    {phase.title}
                  </h4>
                </div>
              );
            })}
          </div>

          {/* MOBILE & TABLET LAYOUT (< lg) */}
          <div className="lg:hidden flex flex-col items-center gap-8 mt-6">
            {/* Mobile Central Hub */}
            {(() => {
              const currentPhase = config.timeline[activePhaseIndex] || config.timeline[0];

              return (
                <div
                  className="w-[290px] h-[290px] sm:w-[330px] sm:h-[330px] rounded-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300 border-[3px] border-cyan-400/90 shadow-[0_0_50px_rgba(0,242,254,0.35),inset_0_0_35px_rgba(0,242,254,0.18)] bg-gradient-to-b from-[#0c1829]/95 via-[#09111f]/95 to-[#07090e]/98 backdrop-blur-xl"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPhase?.id || activePhaseIndex}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center justify-center w-full"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-black tracking-widest uppercase text-cyan-400">
                          {currentPhase?.phaseId || `PHASE 0${activePhaseIndex + 1}`}
                        </span>
                        {currentPhase?.badge && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                            {currentPhase.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-tight mb-2.5 px-2">
                        {currentPhase?.title}
                      </h3>

                      <div className="w-20 h-[2px] mb-2.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                      <p className="text-xs text-slate-300 max-w-[220px] leading-relaxed">
                        {currentPhase?.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Mobile Phase Step Navigation */}
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-sm">
              <button
                type="button"
                onClick={() =>
                  setActivePhaseIndex(
                    (prev) => (prev - 1 + (config.timeline?.length || 6)) % (config.timeline?.length || 6)
                  )
                }
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-400 cursor-pointer"
                aria-label="Previous phase"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(config.timeline || []).map((phase, idx) => (
                <button
                  key={phase.id || idx}
                  type="button"
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    activePhaseIndex === idx
                      ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,242,254,0.5)]'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/30'
                  }`}
                >
                  {`0${idx + 1}`}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setActivePhaseIndex((prev) => (prev + 1) % (config.timeline?.length || 6))
                }
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-400 cursor-pointer"
                aria-label="Next phase"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
              {(config.timeline || []).map((phase, idx) => {
                const isSelected = activePhaseIndex === idx;

                return (
                  <div
                    key={phase.id || idx}
                    onClick={() => setActivePhaseIndex(idx)}
                    className={`rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none ${
                      isSelected
                        ? 'bg-white text-slate-900 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.4)] scale-[1.02]'
                        : 'bg-white/95 text-slate-900 border border-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-black uppercase text-cyan-600">
                        {phase.phaseId || `PHASE 0${idx + 1}`}
                      </span>
                      {phase.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 uppercase">
                          {phase.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold leading-snug text-slate-900">
                      {phase.title}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#06080d]/80 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Process"
            title="HOW IT"
            highlight="WORKS"
            subtitle="Four clean steps from registration to prototype presentation."
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { num: '01', title: 'REGISTER', desc: 'Form your team of 2-4 and secure your spot before registration locks.' },
              { num: '02', title: 'FORM YOUR TEAM', desc: 'Sync roles, setup GitHub repos, and inspect problem statements.' },
              { num: '03', title: 'BUILD YOUR SOLUTION', desc: '8 hours of non-stop coding, mentor critiques, and iterative commits.' },
              { num: '04', title: 'SUBMIT & PRESENT', desc: 'Submit live repository and demo link, followed by jury pitch rounds.' },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md"
              >
                <span className="font-mono text-4xl sm:text-5xl font-black text-cyan-500/25 block mb-4">
                  {step.num}
                </span>
                <h4 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRIZES */}
      <section id="prizes" className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 z-20 select-none overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16 space-y-2.5 w-full">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 sm:w-12 h-[1px] bg-slate-700/60" />
                <span className="text-xs font-mono font-medium tracking-[0.35em] text-slate-400 uppercase">
                  REWARDS FOR IMPACT
                </span>
                <div className="w-8 sm:w-12 h-[1px] bg-slate-700/60" />
              </div>

              <div className="flex flex-col items-center justify-center space-y-2 text-center">
                <h2 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 py-1 drop-shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
                  PRIZES
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-amber-500 via-amber-300 to-blue-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              </div>

              <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] text-slate-400 uppercase max-w-md mx-auto px-4">
                RECOGNIZING IDEAS THAT CREATE REAL IMPACT.
              </p>
            </div>

            {/* Desktop Podium: 2nd Prize (Silver), 1st Prize (Gold), 3rd Prize (Bronze) */}
            <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-12 items-end w-full max-w-4xl mx-auto pt-4 pb-8">
              {/* 2ND PRIZE */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="relative mb-4 flex items-center justify-center">
                  <img
                    src="/silver.webp"
                    alt="Second prize trophy"
                    className="w-44 sm:w-48 lg:w-56 h-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-serif tracking-[0.25em] text-slate-300 uppercase block font-medium">
                    2ND PRIZE
                  </span>
                  <div className="font-serif text-3xl lg:text-4xl text-slate-200 font-normal tracking-tight group-hover:text-white transition-colors">
                    ₹3,000
                  </div>
                </div>
              </motion.div>

              {/* 1ST PRIZE (Elevated center) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center group cursor-pointer -mt-8 pb-2"
              >
                <div className="relative mb-4 flex items-center justify-center">
                  <img
                    src="/gold.webp"
                    alt="First prize trophy"
                    className="w-56 sm:w-64 lg:w-76 h-auto object-contain filter drop-shadow-[0_25px_45px_rgba(59,130,246,0.3)] group-hover:scale-108 transition-transform duration-300 scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-serif tracking-[0.25em] text-amber-300 uppercase block font-medium">
                    1ST PRIZE
                  </span>
                  <div className="font-serif text-4xl lg:text-5xl text-amber-200 font-normal tracking-tight group-hover:text-amber-100 transition-colors">
                    ₹5,000
                  </div>
                </div>
              </motion.div>

              {/* 3RD PRIZE */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="relative mb-4 flex items-center justify-center">
                  <img
                    src="/bronze.webp"
                    alt="Third prize trophy"
                    className="w-44 sm:w-48 lg:w-56 h-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-serif tracking-[0.25em] text-amber-500/90 uppercase block font-medium">
                    3RD PRIZE
                  </span>
                  <div className="font-serif text-3xl lg:text-4xl text-amber-400/90 font-normal tracking-tight group-hover:text-amber-300 transition-colors">
                    ₹2,000
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Stack: 1st, 2nd, 3rd Prize */}
            <div className="flex md:hidden flex-col items-center gap-12 w-full pt-2 pb-6">
              {/* 1st Prize */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center active:scale-98 transition-transform"
              >
                <div>
                  <img
                    src="/gold.webp"
                    alt="First prize trophy"
                    className="w-56 sm:w-64 h-auto object-contain filter drop-shadow-[0_15px_35px_rgba(59,130,246,0.3)] mb-3"
                  />
                </div>
                <span className="text-xs font-serif tracking-[0.25em] text-amber-300 uppercase font-medium">
                  1ST PRIZE
                </span>
                <div className="font-serif text-4xl text-amber-200 font-normal tracking-tight mt-1">
                  ₹5,000
                </div>
              </motion.div>

              {/* 2nd Prize */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center active:scale-98 transition-transform"
              >
                <div>
                  <img
                    src="/silver.webp"
                    alt="Second prize trophy"
                    className="w-48 sm:w-52 h-auto object-contain filter drop-shadow-[0_12px_25px_rgba(0,0,0,0.6)] mb-3"
                  />
                </div>
                <span className="text-xs font-serif tracking-[0.25em] text-slate-300 uppercase font-medium">
                  2ND PRIZE
                </span>
                <div className="font-serif text-3xl text-slate-200 font-normal tracking-tight mt-1">
                  ₹3,000
                </div>
              </motion.div>

              {/* 3rd Prize */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center active:scale-98 transition-transform"
              >
                <div>
                  <img
                    src="/bronze.webp"
                    alt="Third prize trophy"
                    className="w-48 sm:w-52 h-auto object-contain filter drop-shadow-[0_12px_25px_rgba(0,0,0,0.6)] mb-3"
                  />
                </div>
                <span className="text-xs font-serif tracking-[0.25em] text-amber-500/90 uppercase font-medium">
                  3RD PRIZE
                </span>
                <div className="font-serif text-3xl text-amber-400/90 font-normal tracking-tight mt-1">
                  ₹2,000
                </div>
              </motion.div>
            </div>

            {/* Special Rewards Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 sm:mt-16 text-center space-y-2 w-full"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 sm:w-16 h-[1px] bg-slate-700/60" />
                <span className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.35em] text-slate-400 uppercase">
                  SPECIAL REWARDS
                </span>
                <div className="w-10 sm:w-16 h-[1px] bg-slate-700/60" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-sky-300 tracking-wider uppercase pt-1">
                EXCITING REWARDS &amp; GIFT HAMPERS
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. RULES & GUIDELINES */}
      <section id="rules" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#06080d]/80 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="Guidelines"
            title="RULES &"
            highlight="CODE OF CONDUCT"
            subtitle="Fair play and integrity are core to ZETATHON. Review the governing guidelines."
          />

          <div className="space-y-4">
            {config.rules.map((rule) => {
              const isOpen = activeRule === rule.id;

              return (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveRule(isOpen ? null : rule.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        {rule.category}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                        {rule.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        {rule.summary}
                      </p>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 sm:px-6 pb-6 pt-2 border-t border-white/5 space-y-2 text-xs sm:text-sm text-slate-300"
                    >
                      {rule.details?.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="Frequently Asked Questions"
            title="QUESTIONS"
            highlight="ANSWERED"
            subtitle="Everything you need to know about participating, forming teams, and building at ZETATHON."
          />

          <div className="space-y-4">
            {config.faqs.map((faq) => {
              const isOpen = activeFaq === faq.id;

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.question}
                    </span>

                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 sm:px-6 pb-6 pt-2 border-t border-white/5 text-xs sm:text-sm text-slate-400 leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL BOTTOM CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto relative rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-8 sm:p-14 text-center overflow-hidden shadow-[0_0_50px_rgba(0,242,254,0.15)]">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold mb-3 inline-block">
            SLOTS FILLING UP FAST
          </span>

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white uppercase mb-4">
            READY TO HACK WITH ZETA?
          </h3>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
            Gather your squad, prepare your development environments, and let's craft prototypes that make a difference.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-sm font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(0,242,254,0.4)]"
            >
              <span>REGISTER TEAM NOW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-sm font-semibold uppercase tracking-wider text-slate-300 border border-white/10 hover:border-cyan-500/40 hover:bg-white/5 transition-all"
            >
              <span>PARTICIPANT LOGIN</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modal View for Challenge Details */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={Boolean(selectedChallenge)}
        onClose={() => setSelectedChallenge(null)}
      />
    </div>
  );
};
