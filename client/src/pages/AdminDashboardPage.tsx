import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Trophy, Download, Search, CheckCircle2,
  AlertCircle, Trash2, Edit3, Plus, Bell, RefreshCw, Send,
  Layers, Clock, FileCode, ExternalLink, HelpCircle, Save, Award, Sparkles,
  FileText, Mail, Eye, X, Check, ArrowRight, CornerDownRight, History, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Team, Submission, Announcement, Challenge, TimelineItem, FaqItem, HackathonConfig } from '../types/index.js';
import { HACKATHON_CONFIG } from '../hackathon.config.js';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'submissions' | 'announcements' | 'cms'>('overview');

  // Overview data
  const [stats, setStats] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [config, setConfig] = useState<HackathonConfig>(HACKATHON_CONFIG);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [challengeFilter, setChallengeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal: Team Details
  const [detailsTeam, setDetailsTeam] = useState<Team | null>(null);

  // Modal: Status Change Confirmation
  const [statusModal, setStatusModal] = useState<{
    team: Team;
    targetStatus: string;
    reason: string;
  } | null>(null);

  // Modal: Grading
  const [gradingTeamId, setGradingTeamId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Announcement Form
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'general' | 'alert' | 'milestone' | 'workshop'>('general');
  const [newAnnImportant, setNewAnnImportant] = useState(false);

  // CMS Form
  const [cmsConfig, setCmsConfig] = useState<HackathonConfig>(HACKATHON_CONFIG);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, teamsData, subsData, annData, cfgData] = await Promise.all([
        api.admin.getOverview().catch(() => null),
        api.admin.getTeams().catch(() => ({ teams: [] })),
        api.admin.getSubmissions().catch(() => ({ submissions: [] })),
        api.getAnnouncements().catch(() => []),
        api.getConfig().catch(() => HACKATHON_CONFIG),
      ]);

      if (overviewData?.data) setStats(overviewData.data);
      if (teamsData?.teams) setTeams(teamsData.teams);
      if (subsData?.submissions) setSubmissions(subsData.submissions);
      if (annData) setAnnouncements(annData);
      if (cfgData) {
        setConfig(cfgData);
        setCmsConfig(cfgData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const openStatusConfirm = (team: Team, targetStatus: string) => {
    setStatusModal({
      team,
      targetStatus,
      reason: '',
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModal) return;
    const { team, targetStatus, reason } = statusModal;

    try {
      const res = await api.admin.updateTeamStatus(team.id, {
        status: targetStatus,
        reason: reason.trim() || undefined,
      });

      if (res.success && res.team) {
        setTeams(teams.map(t => (t.id === team.id ? res.team : t)));
        if (detailsTeam?.id === team.id) {
          setDetailsTeam(res.team);
        }
        setActionMessage(`Status successfully updated to '${targetStatus}'.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update team selection status');
    } finally {
      setStatusModal(null);
    }
  };

  const handleDownloadPPT = async (team: Team) => {
    if (!team.pptFile) return;
    try {
      await api.admin.downloadPPT(team.id, team.pptFile.originalName);
    } catch (err: any) {
      alert(err.message || 'Error downloading presentation.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to permanently remove this team registration?')) return;
    try {
      await api.admin.deleteTeam(teamId);
      setTeams(teams.filter(t => t.id !== teamId));
      if (detailsTeam?.id === teamId) setDetailsTeam(null);
      setActionMessage('Team registration removed.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete team');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    try {
      const res = await api.admin.createAnnouncement({
        title: newAnnTitle,
        content: newAnnContent,
        category: newAnnCategory,
        isImportant: newAnnImportant,
      });
      if (res.success && res.announcement) {
        setAnnouncements([res.announcement, ...announcements]);
        setNewAnnTitle('');
        setNewAnnContent('');
        setNewAnnImportant(false);
        setActionMessage('Announcement broadcasted to participants!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.admin.deleteAnnouncement(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const handleSaveGrade = async (teamId: string) => {
    try {
      const res = await api.admin.gradeSubmission(teamId, gradeScore, gradeFeedback);
      if (res.success) {
        setSubmissions(submissions.map(s => s.teamId === teamId ? res.submission : s));
        setGradingTeamId(null);
        setActionMessage('Submission evaluated successfully.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to grade submission');
    }
  };

  const handleSaveCmsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateConfig(cmsConfig);
      if (res.success) {
        setConfig(res.config);
        setActionMessage('Live hackathon settings successfully synced and saved!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update configuration');
    }
  };

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.name.toLowerCase().includes(q) ||
        (t.registrationId && t.registrationId.toLowerCase().includes(q)) ||
        (t.teamCode && t.teamCode.toLowerCase().includes(q)) ||
        t.leaderName.toLowerCase().includes(q) ||
        t.leaderEmail.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        (t.college && t.college.toLowerCase().includes(q)) ||
        t.members?.some(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        );
      if (!matchSearch) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_review') {
        if (!['pending_review', 'pending_approval', 'pending', 'pending_verification'].includes(t.status)) return false;
      } else if (statusFilter === 'shortlisted') {
        if (!['shortlisted', 'approved'].includes(t.status)) return false;
      } else if (statusFilter === 'not_shortlisted') {
        if (!['not_shortlisted', 'rejected'].includes(t.status)) return false;
      } else if (statusFilter === 'waitlisted') {
        if (t.status !== 'waitlisted') return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }

    if (challengeFilter !== 'all') {
      if (t.challengeId !== challengeFilter && t.challengeCode !== challengeFilter) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'shortlisted' || status === 'approved') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
          Shortlisted
        </span>
      );
    }
    if (status === 'waitlisted') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-purple-50 text-purple-700 border border-purple-300">
          Waitlisted
        </span>
      );
    }
    if (status === 'not_shortlisted' || status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
          Not Shortlisted
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
        Pending Review
      </span>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-pink-50/60 via-pink-100/30 to-rose-50/40 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-pink-200/80 bg-white/95 backdrop-blur-xl shadow-xl shadow-pink-100/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shadow-md shadow-pink-300/40 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Shield className="w-7 h-7 text-pink-600" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pink-100 text-pink-800 border border-pink-300">
                  <Sparkles className="w-3 h-3 text-pink-600" />
                  ORGANIZING COMMITTEE CONTROL
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 uppercase">
                ZETATHON SELECTION PORTAL
              </h1>

              <p className="text-xs text-slate-600 font-mono">
                Administrator: <span className="text-pink-600 font-bold">{user?.fullName || 'ZETA Core'}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllAdminData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-200 bg-white/90 hover:bg-pink-50 text-slate-700 hover:text-pink-700 text-xs font-mono font-bold uppercase transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => api.admin.exportCSV()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all shadow-[0_4px_16px_rgba(244,114,182,0.45)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Action Message Toast */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl border border-pink-300 bg-pink-100/95 text-pink-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-md shadow-pink-200/50 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>{actionMessage}</span>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-pink-200/80 pb-2">
          {[
            { id: 'overview', label: 'Selection Overview', icon: Trophy },
            { id: 'teams', label: `Teams & PPT Submissions (${teams.length})`, icon: Users },
            { id: 'submissions', label: `Deliverables (${submissions.length})`, icon: FileCode },
            { id: 'announcements', label: `Broadcasts (${announcements.length})`, icon: Bell },
            { id: 'cms', label: 'Hackathon CMS', icon: Edit3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_4px_14px_rgba(244,114,182,0.35)]'
                    : 'bg-white/80 text-slate-600 border border-pink-200 hover:text-pink-700 hover:bg-pink-50/80 shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-pink-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="p-5 rounded-2xl border border-pink-200 bg-white/90 backdrop-blur-md shadow-md shadow-pink-100/40">
                <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Total Teams</span>
                <p className="text-3xl font-black font-mono text-slate-900 mt-1">{teams.length}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  {teams.reduce((acc, t) => acc + 1 + (t.members?.length || 0), 0)} Delegates
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-pink-200 bg-white/90 backdrop-blur-md shadow-md shadow-pink-100/40">
                <span className="text-[11px] font-mono uppercase text-pink-600 font-semibold">PPT Decks Uploaded</span>
                <p className="text-3xl font-black font-mono text-pink-600 mt-1">
                  {teams.filter(t => !!t.pptFile).length}
                </p>
                <p className="text-[10px] text-pink-600/80 mt-1 font-mono">
                  {Math.round((teams.filter(t => !!t.pptFile).length / Math.max(teams.length, 1)) * 100)}% Upload Rate
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 backdrop-blur-md shadow-md shadow-amber-100/40">
                <span className="text-[11px] font-mono uppercase text-amber-700 font-semibold">Pending Review</span>
                <p className="text-3xl font-black font-mono text-amber-700 mt-1">
                  {teams.filter(t => ['pending_review', 'pending_approval', 'pending', 'pending_verification'].includes(t.status)).length}
                </p>
                <p className="text-[10px] text-amber-700/80 mt-1 font-mono">Awaiting Review</p>
              </div>

              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 backdrop-blur-md shadow-md shadow-emerald-100/40">
                <span className="text-[11px] font-mono uppercase text-emerald-700 font-semibold">Shortlisted</span>
                <p className="text-3xl font-black font-mono text-emerald-700 mt-1">
                  {teams.filter(t => ['shortlisted', 'approved'].includes(t.status)).length}
                </p>
                <p className="text-[10px] text-emerald-700/80 mt-1 font-mono">Advanced to Sprint</p>
              </div>

              <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/60 backdrop-blur-md shadow-md shadow-purple-100/40">
                <span className="text-[11px] font-mono uppercase text-purple-700 font-semibold">Waitlisted</span>
                <p className="text-3xl font-black font-mono text-purple-700 mt-1">
                  {teams.filter(t => t.status === 'waitlisted').length}
                </p>
                <p className="text-[10px] text-purple-700/80 mt-1 font-mono">Reserve Pool</p>
              </div>

              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 backdrop-blur-md shadow-md shadow-rose-100/40">
                <span className="text-[11px] font-mono uppercase text-rose-700 font-semibold">Not Shortlisted</span>
                <p className="text-3xl font-black font-mono text-rose-700 mt-1">
                  {teams.filter(t => ['not_shortlisted', 'rejected'].includes(t.status)).length}
                </p>
                <p className="text-[10px] text-rose-700/80 mt-1 font-mono">Declined</p>
              </div>
            </div>

            {/* Distribution by Challenge Track */}
            <div className="p-6 rounded-2xl border border-pink-200 bg-white/90 backdrop-blur-md space-y-4 shadow-lg shadow-pink-100/40">
              <h3 className="text-sm font-mono uppercase font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Registrations by Challenge Track
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {config.challenges.map((c) => {
                  const count = teams.filter(t => t.challengeId === c.id || t.challengeCode === c.code).length;
                  return (
                    <div key={c.id} className="p-3.5 rounded-xl border border-pink-100 bg-pink-50/50 hover:bg-pink-100/50 transition-colors flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-pink-600 font-bold">{c.code}</span>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{c.title}</p>
                      </div>
                      <span className="text-lg font-mono font-black text-pink-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAMS & PPT SUBMISSIONS */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team, reg ID, leader, member..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-pink-200 bg-white text-slate-900 placeholder-slate-400 text-xs focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-slate-800 text-xs font-mono focus:border-pink-500 focus:outline-none shadow-sm"
                  >
                    <option value="all">All Statuses ({teams.length})</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="not_shortlisted">Not Shortlisted</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Track:</span>
                  <select
                    value={challengeFilter}
                    onChange={(e) => setChallengeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-slate-800 text-xs font-mono focus:border-pink-500 focus:outline-none shadow-sm"
                  >
                    <option value="all">All Tracks</option>
                    {config.challenges.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Teams Table */}
            <div className="rounded-2xl border border-pink-200 bg-white/95 backdrop-blur-md overflow-x-auto shadow-xl shadow-pink-100/40">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-pink-200 bg-pink-100/70 font-mono uppercase text-pink-950 text-[11px] font-bold">
                  <tr>
                    <th className="p-4">Reg ID & Team</th>
                    <th className="p-4">Team Leader</th>
                    <th className="p-4">Roster</th>
                    <th className="p-4">Project PPT</th>
                    <th className="p-4">Selection Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/80">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No team registrations match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const regId = team.registrationId || team.teamCode;
                      const hasPPT = !!team.pptFile;

                      return (
                        <tr key={team.id} className="hover:bg-pink-50/40 transition-colors">
                          <td className="p-4">
                            <span className="text-[10px] text-pink-600 font-mono font-bold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200 inline-block mb-1">
                              {regId}
                            </span>
                            <p className="font-bold text-slate-900 text-sm font-mono">{team.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {team.challengeCode || 'Open Track'}
                            </span>
                          </td>

                          <td className="p-4">
                            <p className="text-slate-800 font-semibold">{team.leaderName}</p>
                            <p className="text-slate-500 text-[11px] font-mono">{team.leaderEmail}</p>
                            <p className="text-slate-500 text-[10px]">{team.phone} • {team.college}</p>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-800">
                              {1 + (team.members?.length || 0)} Total
                            </span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {team.members?.map(m => m.name).join(', ') || 'Only leader'}
                            </p>
                          </td>

                          <td className="p-4">
                            {hasPPT ? (
                              <button
                                onClick={() => handleDownloadPPT(team)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-700 font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                title="Download uploaded project PPT"
                              >
                                <FileText className="w-3.5 h-3.5 text-pink-500" />
                                <span>Download PPT</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono italic">
                                No PPT uploaded
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="space-y-1">
                              {getStatusBadge(team.status)}
                              {team.approvedBy && (
                                <p className="text-[9px] text-slate-400 font-mono">
                                  by {team.approvedBy}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setDetailsTeam(team)}
                              className="px-2.5 py-1 rounded-lg border border-pink-200 bg-white hover:bg-pink-50 text-slate-700 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                              title="View Full Details"
                            >
                              <Eye className="w-3 h-3 text-pink-500" />
                              <span>Details</span>
                            </button>

                            <button
                              onClick={() => openStatusConfirm(team, 'shortlisted')}
                              disabled={team.status === 'shortlisted' || team.status === 'approved'}
                              className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-mono font-bold uppercase transition-all disabled:opacity-30 cursor-pointer"
                              title="Mark Shortlisted"
                            >
                              Shortlist
                            </button>

                            <button
                              onClick={() => openStatusConfirm(team, 'waitlisted')}
                              disabled={team.status === 'waitlisted'}
                              className="px-2 py-1 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-mono font-bold uppercase transition-all disabled:opacity-30 cursor-pointer"
                              title="Mark Waitlisted"
                            >
                              Waitlist
                            </button>

                            <button
                              onClick={() => openStatusConfirm(team, 'not_shortlisted')}
                              disabled={team.status === 'not_shortlisted' || team.status === 'rejected'}
                              className="px-2 py-1 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-mono font-bold uppercase transition-all disabled:opacity-30 cursor-pointer"
                              title="Mark Not Shortlisted"
                            >
                              Decline
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMISSIONS (PROJECT DELIVERABLES) */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-pink-200 bg-white/95 backdrop-blur-md overflow-x-auto shadow-xl shadow-pink-100/40">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-pink-200 bg-pink-100/70 font-mono uppercase text-pink-950 text-[11px] font-bold">
                  <tr>
                    <th className="p-4">Team</th>
                    <th className="p-4">Project Title</th>
                    <th className="p-4">Repository / Links</th>
                    <th className="p-4">Status & Score</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/80">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        No project deliverables have been submitted yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-pink-50/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{sub.teamName}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{sub.projectTitle}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{sub.projectDescription}</p>
                        </td>
                        <td className="p-4">
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-pink-600 hover:underline font-mono"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-4">
                          {sub.status === 'evaluated' ? (
                            <span className="font-mono font-bold text-emerald-600">{sub.score} / 100</span>
                          ) : (
                            <span className="font-mono text-amber-600">Pending Evaluation</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setGradingTeamId(sub.teamId);
                              setGradeScore(sub.score || 85);
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-700 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer"
                          >
                            Grade Project
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grading Modal */}
            {gradingTeamId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-md bg-white rounded-2xl border border-pink-200 p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold font-mono uppercase text-slate-900">
                    Grade Project Submission
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-slate-600">Score (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gradeScore}
                      onChange={(e) => setGradeScore(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-slate-900 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-slate-600">Jury Feedback</label>
                    <textarea
                      rows={3}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Feedback for participants..."
                      className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setGradingTeamId(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-mono uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveGrade(gradingTeamId)}
                      className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-bold uppercase cursor-pointer"
                    >
                      Save Score
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateAnnouncement} className="p-6 rounded-2xl border border-pink-200 bg-white/95 space-y-4 shadow-lg shadow-pink-100/40">
              <h3 className="text-sm font-mono uppercase font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-pink-500" />
                Broadcast Announcement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Announcement Title"
                  className="px-4 py-2 rounded-xl border border-pink-200 bg-pink-50/30 text-xs"
                />
                <select
                  value={newAnnCategory}
                  onChange={(e) => setNewAnnCategory(e.target.value as any)}
                  className="px-4 py-2 rounded-xl border border-pink-200 bg-pink-50/30 text-xs"
                >
                  <option value="general">General</option>
                  <option value="alert">Alert / Urgent</option>
                  <option value="milestone">Milestone</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                placeholder="Announcement message content..."
                className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/30 text-xs"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAnnImportant}
                    onChange={(e) => setNewAnnImportant(e.target.checked)}
                    className="accent-pink-500"
                  />
                  <span>Mark High Priority / Alert</span>
                </label>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-bold uppercase transition-all shadow-md shadow-pink-200 cursor-pointer"
                >
                  Post Announcement
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-pink-200 bg-white flex items-start justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{a.content}</p>
                    <span className="text-[10px] text-pink-500 font-mono mt-2 block">
                      {new Date(a.createdAt).toLocaleDateString()} by {a.authorName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CMS */}
        {activeTab === 'cms' && (
          <form onSubmit={handleSaveCmsConfig} className="p-6 rounded-2xl border border-pink-200 bg-white/95 space-y-6 shadow-xl shadow-pink-100/40">
            <h3 className="text-sm font-mono uppercase font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-pink-500" />
              Event Schedule & Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-600">Event Name</label>
                <input
                  type="text"
                  value={cmsConfig.name}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/30 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-600">Venue</label>
                <input
                  type="text"
                  value={cmsConfig.dates.venue}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    dates: { ...cmsConfig.dates, venue: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/30 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-bold uppercase transition-all shadow-md shadow-pink-200 cursor-pointer"
            >
              Save Hackathon Configuration
            </button>
          </form>
        )}

        {/* MODAL 1: STATUS CHANGE CONFIRMATION DIALOG */}
        {statusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-pink-200 p-6 sm:p-8 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono uppercase text-slate-900">
                    Confirm Selection Status Change
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Team: <strong className="text-slate-800">{statusModal.team.name}</strong> ({statusModal.team.registrationId || statusModal.team.teamCode})
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono">Current Status:</span>
                  {getStatusBadge(statusModal.team.status)}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-pink-200/60">
                  <span className="text-slate-500 font-mono">New Status:</span>
                  {getStatusBadge(statusModal.targetStatus)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-slate-700">
                  Notes / Selection Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                  placeholder="e.g. Excellent architectural proposal in track CH-01."
                  className="w-full p-3 rounded-xl border border-pink-200 bg-white text-slate-800 text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-mono text-xs font-semibold uppercase hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-bold uppercase transition-all shadow-md shadow-pink-200 cursor-pointer"
                >
                  Confirm & Update Status
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: FULL TEAM DETAILS & PPT INSPECTION */}
        {detailsTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-pink-200 p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-pink-200">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded border border-pink-200">
                    {detailsTeam.registrationId || detailsTeam.teamCode}
                  </span>
                  <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">{detailsTeam.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{detailsTeam.challengeCode || 'Open Track'} • Registered {new Date(detailsTeam.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => setDetailsTeam(null)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Actions Card */}
              <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Status:</span>
                  {getStatusBadge(detailsTeam.status)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openStatusConfirm(detailsTeam, 'shortlisted')}
                    className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-mono font-bold uppercase cursor-pointer"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => openStatusConfirm(detailsTeam, 'waitlisted')}
                    className="px-2.5 py-1 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-mono font-bold uppercase cursor-pointer"
                  >
                    Waitlist
                  </button>
                  <button
                    onClick={() => openStatusConfirm(detailsTeam, 'not_shortlisted')}
                    className="px-2.5 py-1 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-mono font-bold uppercase cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>

              {/* PPT Presentation Submission */}
              <div className="p-4 rounded-2xl border border-pink-200 bg-white space-y-3 shadow-sm">
                <span className="text-xs font-mono uppercase font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-pink-500" />
                  Project Presentation (PPT / PDF)
                </span>
                {detailsTeam.pptFile ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pink-50/60 border border-pink-100">
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-800">{detailsTeam.pptFile.originalName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(detailsTeam.pptFile.sizeBytes / (1024 * 1024)).toFixed(2)} MB • Verified binary
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadPPT(detailsTeam)}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Deck</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono italic">
                    No presentation uploaded during registration.
                  </p>
                )}
              </div>

              {/* Leader & Member Roster Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-800">
                  Full Delegate Roster ({1 + (detailsTeam.members?.length || 0)} Total)
                </h4>
                <div className="space-y-2 text-xs">
                  {/* Leader */}
                  <div className="p-3.5 rounded-xl border border-pink-200 bg-pink-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{detailsTeam.leaderName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500 text-white uppercase">
                        Team Leader
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono">{detailsTeam.leaderEmail} • {detailsTeam.phone}</p>
                    <p className="text-slate-500">{detailsTeam.college} • {detailsTeam.department} • {detailsTeam.year}</p>
                  </div>

                  {/* Members */}
                  {detailsTeam.members?.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          Member #{idx + 2}
                        </span>
                      </div>
                      <p className="text-slate-600 font-mono">{m.email} {m.phone ? `• ${m.phone}` : ''}</p>
                      <p className="text-slate-500">{m.college || detailsTeam.college} • {m.department || detailsTeam.department} • {m.year || detailsTeam.year}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit History Log */}
              {detailsTeam.auditLog && detailsTeam.auditLog.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Selection Audit History ({detailsTeam.auditLog.length})
                  </h4>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-[11px] font-mono">
                    {detailsTeam.auditLog.map((log) => (
                      <div key={log.id} className="p-2.5 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {log.previousStatus} &rarr; <span className="text-pink-600">{log.newStatus}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">By: {log.changedBy} {log.reason ? `• Note: "${log.reason}"` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleDeleteTeam(detailsTeam.id)}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Delete Team
                </button>
                <button
                  onClick={() => setDetailsTeam(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
