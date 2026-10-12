import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Terminal, Clock, CheckCircle2, AlertCircle, Copy,
  ExternalLink, UploadCloud, Bell, Award, FileCode, Check, Shield,
  Layers, Lock, Sparkles, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { HACKATHON_CONFIG } from '../hackathon.config.js';
import { CountdownTimer } from '../components/common/CountdownTimer.js';
import { api } from '../services/api.js';
import { Submission, Announcement } from '../types/index.js';
import { Link } from 'react-router-dom';

export const ParticipantDashboardPage: React.FC = () => {
  const { user, team, submission, setSubmission } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Submission Form State
  const [projectTitle, setProjectTitle] = useState(submission?.projectTitle || '');
  const [projectDescription, setProjectDescription] = useState(submission?.projectDescription || '');
  const [githubUrl, setGithubUrl] = useState(submission?.githubUrl || '');
  const [demoUrl, setDemoUrl] = useState(submission?.demoUrl || '');
  const [videoUrl, setVideoUrl] = useState(submission?.videoUrl || '');
  const [remarks, setRemarks] = useState(submission?.remarks || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync state if submission changes
  useEffect(() => {
    if (submission) {
      setProjectTitle(submission.projectTitle || '');
      setProjectDescription(submission.projectDescription || '');
      setGithubUrl(submission.githubUrl || '');
      setDemoUrl(submission.demoUrl || '');
      setVideoUrl(submission.videoUrl || '');
      setRemarks(submission.remarks || '');
    }
  }, [submission]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const anns = await api.getAnnouncements();
        setAnnouncements(anns);
        const subRes = await api.getMySubmission();
        if (subRes.success && subRes.submission) {
          setSubmission(subRes.submission);
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchDashboardData();
  }, [setSubmission]);

  // Check deadline & approval
  const submissionDeadline = new Date(HACKATHON_CONFIG.dates.submissionDeadline).getTime();
  const isPastDeadline = Date.now() > submissionDeadline;
  const isApproved = team?.status === 'approved';

  const handleCopyTeamCode = () => {
    if (team?.teamCode) {
      navigator.clipboard.writeText(team.teamCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (isPastDeadline) {
      setSubmitError('The hackathon submission deadline has closed.');
      return;
    }

    if (!team) {
      setSubmitError('You must be part of a registered team to submit a project.');
      return;
    }

    if (!isApproved) {
      setSubmitError(`Project submission is locked until organizer approval. Current status: ${team.status}`);
      return;
    }

    if (!projectTitle.trim()) {
      setSubmitError('Project title is required.');
      return;
    }
    if (!projectDescription.trim() || projectDescription.length < 20) {
      setSubmitError('Project description must be at least 20 characters.');
      return;
    }
    if (!githubUrl.trim() || !githubUrl.includes('github.com')) {
      setSubmitError('A valid public GitHub repository URL is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitProject({
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        githubUrl: githubUrl.trim(),
        demoUrl: demoUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success && res.submission) {
        setSubmission(res.submission);
        setSubmitSuccess(res.message || 'Project submission stored successfully!');
      } else {
        setSubmitError('Submission could not be saved.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error saving project submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500" />

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-cyan-400/50 p-0.5 bg-black shrink-0 shadow-[0_0_30px_rgba(0,242,254,0.35)]">
              <img
                src="/zeta-logo.jpg"
                alt="ZETA Logo"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Participant Console
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ZETATHON 8-HOUR ARENA
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white uppercase">
                Welcome, <span className="text-cyan-400">{user?.fullName || 'Hacker'}</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                Account: {user?.email} • Role: {user?.role?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Quick Countdown Box */}
          <div className="p-4 rounded-xl border border-white/10 bg-slate-950/70 text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
              Time Until Submissions Freeze
            </span>
            <CountdownTimer
              targetDate={HACKATHON_CONFIG.dates.submissionDeadline}
              className="scale-90 origin-right"
              showLabels={false}
            />
          </div>
        </div>

        {/* Team Approval Status Alert Banner */}
        {team && team.status === 'pending_approval' && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-300">
                  Email verified — Awaiting organizer approval
                </h3>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Your email has been confirmed. The ZETATHON organizing committee is currently reviewing your team registration. Project submission features will unlock once your team is approved.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              PENDING APPROVAL
            </span>
          </div>
        )}

        {team && team.status === 'waitlisted' && (
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5 sm:mt-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-purple-300">
                  Registration Waitlisted
                </h3>
                <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                  Your team is currently on the waitlist. If spots open up before hacking begins, the organizers will approve your entry.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
              WAITLISTED
            </span>
          </div>
        )}

        {team && team.status === 'rejected' && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-rose-300">
                  Registration Declined
                </h3>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  Your team registration was declined by the organizers. Please contact the help desk if you believe this was in error.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              REJECTED
            </span>
          </div>
        )}

        {team && team.status === 'approved' && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-emerald-300">
                  Registration Approved & Verified
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Your team is officially cleared to hack! Build your project and submit your deliverables before the countdown concludes.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              OFFICIALLY APPROVED
            </span>
          </div>
        )}

        {/* Status Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Overview Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Team Assignment
              </span>

              {team ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {team.status.toUpperCase()}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  NO TEAM LINKED
                </span>
              )}
            </div>

            {team ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-black text-white font-mono">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-cyan-400">{team.teamCode}</span>
                    <button
                      onClick={handleCopyTeamCode}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy Team Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                    Squad Members ({1 + (team.members?.length || 0)} Total)
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between p-1.5 rounded bg-white/5">
                      <span>👑 {team.leaderName} (Leader)</span>
                      <span className="text-[10px] text-slate-500 font-mono">{team.year}</span>
                    </div>
                    {team.members?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-1.5 rounded bg-white/5">
                        <span>• {m.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{m.year || 'Member'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-4">
                <p className="text-xs text-slate-400">
                  You are currently logged in with an unlinked personal account.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold uppercase bg-cyan-400 text-black hover:bg-cyan-300 transition-all font-mono"
                >
                  Register Team Now
                </Link>
              </div>
            )}
          </div>

          {/* Selected Challenge Track Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Selected Challenge Track
            </span>

            {team?.challengeTitle ? (
              <div className="space-y-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-block">
                  {team.challengeCode || 'TRACK'}
                </span>
                <h4 className="text-lg font-bold text-white">
                  {team.challengeTitle}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                  Check the public challenge brief for rubrics and deliverables before final code freeze.
                </p>
                <a
                  href="/#challenges"
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 mt-2"
                >
                  View full criteria & rubrics <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  OPEN / UNASSIGNED
                </span>
                <p className="text-xs text-slate-400">
                  No specific challenge chosen yet. You may compete in Open Track or select a domain before hacking kicks off.
                </p>
              </div>
            )}
          </div>

          {/* Submission Status Badge Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              Submission Status
            </span>

            {submission ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold font-mono">PROJECT SUBMITTED</p>
                    <p className="text-[11px] text-emerald-400/80">
                      Last updated: {new Date(submission.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p><strong>Title:</strong> {submission.projectTitle}</p>
                  <p className="truncate"><strong>GitHub:</strong> {submission.githubUrl}</p>
                  {submission.score !== undefined && (
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 font-mono text-xs mt-2">
                      ⭐ Score: {submission.score} / 100
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold font-mono">PENDING SUBMISSION</p>
                    <p className="text-[11px] text-amber-400/80">
                      Submit project repository below before 05:00 PM.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  You can update your submission anytime before the countdown reaches zero.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Announcements Section */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Live Organizers Announcements ({announcements.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-500">REAL-TIME DISPATCH</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border ${
                  ann.isImportant
                    ? 'border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                    : 'border-white/5 bg-slate-950/40'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                    {ann.category}
                  </span>
                  {ann.isImportant && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Important
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
                <div className="pt-2 text-[10px] text-slate-500 font-mono">
                  {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ann.authorName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Submission Portal */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white uppercase flex items-center gap-2.5">
                <FileCode className="w-6 h-6 text-cyan-400" />
                PROJECT SUBMISSION PORTAL
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Submit and update your deliverables for the jury evaluation. Submissions lock at 05:00 PM sharp.
              </p>
            </div>

            {isPastDeadline ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-950/30 text-rose-400 text-xs font-mono font-bold uppercase">
                <Lock className="w-3.5 h-3.5" />
                PORTAL LOCKED
              </div>
            ) : !isApproved ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 text-xs font-mono font-bold uppercase">
                <Lock className="w-3.5 h-3.5" />
                AWAITING APPROVAL
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 text-xs font-mono font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                SUBMISSIONS OPEN
              </div>
            )}
          </div>

          {/* Locked Notice if Not Approved */}
          {!isApproved && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs sm:text-sm flex items-center gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Project submissions unlock automatically once your team registration is approved by organizers. Current registration status: <strong>{team?.status || 'unregistered'}</strong>.
              </span>
            </div>
          )}

          {/* Submission Alerts */}
          {submitError && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProject} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Project Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isPastDeadline || !isApproved}
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. AegisGrid: Smart Campus Energy Optimizer"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Project Description & Abstract <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  disabled={isPastDeadline || !isApproved}
                  required
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Explain the problem solved, tech architecture, prototype capabilities, and how it addresses the track..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Public GitHub Repository URL <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="url"
                  disabled={isPastDeadline || !isApproved}
                  required
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/team/zetathon-project"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Live Demo URL (Vercel / Netlify / Render)
                </label>
                <input
                  type="url"
                  disabled={isPastDeadline || !isApproved}
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://my-demo-app.vercel.app"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Presentation / Pitch Walkthrough Video Link
                </label>
                <input
                  type="url"
                  disabled={isPastDeadline || !isApproved}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or Google Drive link"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Final Remarks / Instructions for Jury
                </label>
                <input
                  type="text"
                  disabled={isPastDeadline || !isApproved}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Test credentials: demo / pass123"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                {isPastDeadline
                  ? 'Submissions locked. Best of luck during the jury pitch evaluation!'
                  : !isApproved
                  ? 'Submissions locked until team registration is approved by organizers.'
                  : 'You can update and refine this submission as often as you want before the deadline.'}
              </span>

              <button
                type="submit"
                disabled={isSubmitting || isPastDeadline || !team || !isApproved}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>SAVING DELIVERABLES...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{submission ? 'UPDATE SUBMISSION' : 'SUBMIT PROJECT TO JURY'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
