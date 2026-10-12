import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Trash2, ArrowRight, AlertCircle, Shield,
  Terminal, Sparkles, CheckCircle2, ChevronLeft, RefreshCw,
  Upload, FileText, X, Check, Eye, Edit2, ShieldAlert
} from 'lucide-react';
import { HACKATHON_CONFIG } from '../hackathon.config.js';
import { api } from '../services/api.js';
import { RegisterSuccessModal } from '../components/modals/RegisterSuccessModal.js';
import { Team } from '../types/index.js';

interface MemberField {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
}

export const DEPARTMENT_OPTIONS = [
  'CSE',
  'AI&DS',
  'AI&ML',
  'ECE',
  'EEE',
  'IT',
  'CYBER',
  'MECH',
] as const;

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedChallenge = searchParams.get('challenge') || '';

  // Step state: 'form' | 'review'
  const [step, setStep] = useState<'form' | 'review'>('form');

  // Team Details
  const [teamName, setTeamName] = useState('');
  const [challengeId, setChallengeId] = useState('open-innovation');

  // Team Leader Details
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('Dhanalakshmi College of Engineering');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('3rd Year');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Additional Team Members (1 to 3 members -> 2 to 4 members total)
  const [members, setMembers] = useState<MemberField[]>([
    {
      name: '',
      email: '',
      phone: '',
      college: 'Dhanalakshmi College of Engineering',
      department: 'CSE',
      year: '3rd Year',
    },
  ]);

  // Project PPT Presentation File
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Processing & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredTeam, setRegisteredTeam] = useState<Team | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (preselectedChallenge) {
      setChallengeId(preselectedChallenge);
    }
  }, [preselectedChallenge]);

  const handleAddMember = () => {
    if (members.length < 3) {
      setMembers([
        ...members,
        {
          name: '',
          email: '',
          phone: '',
          college: college || 'Dhanalakshmi College of Engineering',
          department: 'CSE',
          year: '3rd Year',
        },
      ]);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, idx) => idx !== index));
    }
  };

  const handleMemberChange = (index: number, field: keyof MemberField, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const validExtensions = ['.pdf', '.pptx', '.ppt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setFileError('Invalid file type. Only PDF (.pdf) and PowerPoint (.pptx, .ppt) documents are allowed.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds 25 MB limit. Please compress or optimize your presentation.');
      return;
    }

    setPptFile(file);
  };

  const validateAllFields = (): boolean => {
    setFormError(null);

    if (!teamName.trim() || teamName.trim().length < 3) {
      setFormError('Team Name must be at least 3 characters long.');
      return false;
    }

    if (!leaderName.trim()) {
      setFormError('Team Leader Full Name is required.');
      return false;
    }

    const normLeaderEmail = leaderEmail.trim().toLowerCase();
    if (!normLeaderEmail || !normLeaderEmail.includes('@') || !normLeaderEmail.includes('.')) {
      setFormError('Please enter a valid Team Leader email address.');
      return false;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please provide a valid 10-digit contact phone number for the leader.');
      return false;
    }

    if (!college.trim()) {
      setFormError('College or Institution name is required.');
      return false;
    }

    // Validate members
    const memberEmails = new Set<string>();
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim()) {
        setFormError(`Please enter the Full Name for Member #${i + 2}.`);
        return false;
      }

      const mEmail = m.email.trim().toLowerCase();
      if (!mEmail || !mEmail.includes('@') || !mEmail.includes('.')) {
        setFormError(`Please enter a valid email address for Member #${i + 2}.`);
        return false;
      }

      if (mEmail === normLeaderEmail) {
        setFormError(`Member #${i + 2} (${m.name}) cannot use the Team Leader's email address.`);
        return false;
      }

      if (memberEmails.has(mEmail)) {
        setFormError(`Duplicate member email detected: ${mEmail}. Each member must have a unique email.`);
        return false;
      }
      memberEmails.add(mEmail);
    }

    if (!pptFile) {
      setFormError('Please upload your Project Presentation (PPT / PDF) deck before submitting.');
      return false;
    }

    return true;
  };

  const handleProceedToReview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateAllFields()) {
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateAllFields()) {
      setStep('form');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('teamName', teamName.trim());
      formData.append('leaderName', leaderName.trim());
      formData.append('leaderEmail', leaderEmail.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('department', department);
      formData.append('year', year);
      formData.append('college', college);
      if (challengeId) formData.append('challengeId', challengeId);
      if (githubUrl.trim()) formData.append('githubUrl', githubUrl.trim());
      if (linkedinUrl.trim()) formData.append('linkedinUrl', linkedinUrl.trim());

      formData.append('members', JSON.stringify(members));

      if (pptFile) {
        formData.append('pptFile', pptFile);
      }

      const res = await api.registerTeam(formData);

      if (res.success && res.team) {
        setRegisteredTeam(res.team);
        setShowSuccessModal(true);
      } else {
        setFormError(res.message || res.error || 'Registration failed. Please review your details.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while submitting your team registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFinalSubmit();
  };

  const totalTeamSize = 1 + members.length;
  const selectedChallengeObj = HACKATHON_CONFIG.challenges.find(c => c.id === challengeId || c.code === challengeId);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-6 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to ZETATHON Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-cyan-400/50 p-0.5 bg-black mx-auto shadow-[0_0_30px_rgba(0,242,254,0.35)]">
            <img
              src="/zeta-logo.jpg"
              alt="ZETA Logo"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            OFFICIAL TEAM REGISTRATION & PPT SUBMISSION
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white uppercase">
            {step === 'review' ? 'REVIEW REGISTRATION' : 'ENTER THE ARENA'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-sans">
            {step === 'review'
              ? 'Confirm your team details and uploaded project presentation before submitting.'
              : 'Complete your team registration and upload your presentation deck. Teams must have 2 to 4 members.'}
          </p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className={`w-8 h-1 rounded-full ${step === 'form' ? 'bg-cyan-400' : 'bg-cyan-400/40'}`} />
            <span className={`w-8 h-1 rounded-full ${step === 'review' ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'form' && (
          <form onSubmit={handleFormDirectSubmit} className="space-y-8">
            {/* SECTION 1: TEAM INFORMATION */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <Terminal className="w-5 h-5" />
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                    1. Squad & Problem Track
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold">
                  {totalTeamSize} / 4 Members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1">
                    Team Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CyberVanguard, Synapse"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center justify-between">
                    <span>Problem Track</span>
                    <span className="text-[10px] text-cyan-400 font-semibold font-mono">Open to All Domains</span>
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-black/40 text-cyan-300 text-xs font-mono flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Open Innovation Track
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 uppercase font-mono">
                      Universal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TEAM LEADER (PRIMARY CONTACT) */}
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                    2. Team Leader
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400 text-black uppercase">
                  Team Leader
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Leader Full Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Leader Email Address <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={leaderEmail}
                    onChange={(e) => setLeaderEmail(e.target.value)}
                    placeholder="alex@college.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Primary point of contact for the squad</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Contact Phone Number <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    College / Institution <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Dhanalakshmi College of Engineering"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Department <span className="text-pink-400">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase font-bold text-slate-300">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Post-Graduate">Post-Graduate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: ADDITIONAL TEAM MEMBERS */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <Users className="w-5 h-5" />
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                    3. Additional Team Members ({members.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  1 to 3 additional members
                </span>
              </div>

              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/5 bg-slate-950/60 relative space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        Member #{idx + 2}
                      </span>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                          placeholder="Member Name"
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/40 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={member.email}
                          onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                          placeholder="member@college.edu"
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/40 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={member.phone}
                          onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/40 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          College Name
                        </label>
                        <input
                          type="text"
                          value={member.college}
                          onChange={(e) => handleMemberChange(idx, 'college', e.target.value)}
                          placeholder="e.g. Dhanalakshmi College of Engineering"
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/40 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          Department
                        </label>
                        <select
                          value={member.department}
                          onChange={(e) => handleMemberChange(idx, 'department', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                        >
                          {DEPARTMENT_OPTIONS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-slate-400">
                          Year
                        </label>
                        <select
                          value={member.year}
                          onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950 text-white text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {members.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Another Member ({totalTeamSize}/4)</span>
                </button>
              )}
            </div>

            {/* SECTION 4: PROJECT PPT UPLOAD */}
            <div className="rounded-2xl border border-pink-500/30 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-pink-500/20">
                <div className="flex items-center gap-2.5 text-pink-400">
                  <FileText className="w-5 h-5 text-pink-400" />
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                    4. Project Presentation Deck (PPT / PDF)
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase">
                  Required
                </span>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Upload your team's project concept deck, abstract, or presentation. Accepted formats: <strong className="text-white">PDF (.pdf)</strong>, <strong className="text-white">PPTX (.pptx)</strong>, or <strong className="text-white">PPT (.ppt)</strong> up to 25 MB. All files undergo binary verification and are stored in isolated organizer storage.
              </p>

              {fileError && (
                <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{fileError}</span>
                </div>
              )}

              {!pptFile ? (
                <label className="border-2 border-dashed border-pink-500/40 hover:border-pink-400 bg-pink-950/10 hover:bg-pink-950/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Click to choose or drag presentation deck here
                    </p>
                    <p className="text-[11px] text-slate-400 font-sans mt-1">
                      PDF, PPTX, or PPT (Max 25 MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.ppt,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-white truncate">{pptFile.name}</p>
                      <p className="text-[10px] text-emerald-300/80 font-mono">
                        {(pptFile.size / (1024 * 1024)).toFixed(2)} MB • Verified format
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPptFile(null)}
                    className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-500/20 text-xs font-mono transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleProceedToReview()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-slate-300 border border-white/20 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Review Details</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`registration-submit w-full sm:w-auto px-8 py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(0,242,254,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${isSubmitting ? 'is-submitting' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration & PPT...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration & PPT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW SUMMARY */}
        {step === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <Eye className="w-5 h-5" />
                <h2 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                  Review Registration Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/60 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Team Name</span>
                <p className="font-bold text-white font-mono text-sm">{teamName}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/60 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Track</span>
                <p className="font-bold text-cyan-300 font-mono">
                  {selectedChallengeObj ? `${selectedChallengeObj.code} - ${selectedChallengeObj.title}` : 'Open Innovation Track'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/60 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Team Leader</span>
                <p className="font-bold text-white">{leaderName}</p>
                <p className="text-slate-400 font-mono">{leaderEmail}</p>
                <p className="text-slate-400 font-mono">{phone}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/60 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">College & Department</span>
                <p className="font-bold text-white">{college}</p>
                <p className="text-slate-400">{department} • {year}</p>
              </div>
            </div>

            {/* Members Summary */}
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Team Members ({totalTeamSize} Total)
              </span>
              <div className="divide-y divide-white/5 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <strong className="text-white">{leaderName}</strong> (Leader)
                    <p className="text-slate-400 font-mono text-[11px]">{leaderEmail}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Team Leader
                  </span>
                </div>
                {members.map((m, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{m.name}</strong> (Member #{idx + 2})
                      <p className="text-slate-400 font-mono text-[11px]">{m.email} {m.phone ? `• ${m.phone}` : ''}</p>
                    </div>
                    <span className="text-slate-400 text-[11px]">{m.department || department}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PPT File summary */}
            <div className="p-4 rounded-xl border border-pink-500/30 bg-pink-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-pink-400" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">{pptFile?.name}</p>
                  <p className="text-[10px] text-pink-300/80 font-mono">
                    {pptFile ? (pptFile.size / (1024 * 1024)).toFixed(2) : 0} MB • Ready for organizer review
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Attached
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="py-3 px-5 rounded-xl font-mono text-xs font-semibold uppercase text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                aria-busy={isSubmitting}
                className={`registration-submit flex-1 py-3.5 px-6 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(0,242,254,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${isSubmitting ? 'is-submitting' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration & PPT...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Confirmation Success Modal */}
        <RegisterSuccessModal
          isOpen={showSuccessModal}
          team={registeredTeam}
          onClose={() => setShowSuccessModal(false)}
        />
      </div>
    </div>
  );
};
