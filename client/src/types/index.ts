import { Challenge, TimelineItem, PrizeItem, FaqItem, RuleItem, HackathonConfig } from '../hackathon.config.js';

export type { Challenge, TimelineItem, PrizeItem, FaqItem, RuleItem, HackathonConfig };

export type UserRole = 'participant' | 'admin' | 'mentor' | 'judge';

export type TeamStatus =
  | 'pending_review'
  | 'shortlisted'
  | 'waitlisted'
  | 'not_shortlisted'
  | 'pending_verification'
  | 'pending_approval'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  department?: string;
  year?: string;
  college?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  role: UserRole;
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  role: 'Leader' | 'Member';
}

export interface PPTFileMetadata {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  storedPath?: string;
}

export interface StatusAuditRecord {
  id: string;
  timestamp: string;
  changedBy: string;
  previousStatus: TeamStatus;
  newStatus: TeamStatus;
  reason?: string;
}

export interface TeamEmailStatus {
  registrationEmail: {
    status: 'sent' | 'failed' | 'pending' | 'not_sent';
    sentAt?: string;
    error?: string;
    messageId?: string;
  };
  selectionEmail: {
    status: 'sent' | 'failed' | 'pending' | 'not_sent';
    sentAt?: string;
    lastStatusNotified?: string;
    error?: string;
    messageId?: string;
  };
}

export interface Team {
  id: string;
  registrationId: string;
  name: string;
  teamCode: string;
  teamSize?: number;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  phone: string;
  department: string;
  year: string;
  college: string;
  githubUrl?: string;
  linkedinUrl?: string;
  challengeId?: string;
  challengeCode?: string;
  challengeTitle?: string;
  members: TeamMember[];
  pptFile?: PPTFileMetadata;
  status: TeamStatus;
  auditLog?: StatusAuditRecord[];
  emailStatus?: TeamEmailStatus;
  emailVerified?: boolean;
  verifiedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  challengeCode: string;
  projectTitle: string;
  projectDescription: string;
  githubUrl: string;
  demoUrl?: string;
  videoUrl?: string;
  remarks?: string;
  status: 'draft' | 'submitted' | 'evaluated';
  score?: number;
  feedback?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'alert' | 'milestone' | 'workshop';
  isImportant: boolean;
  authorName: string;
  createdAt: string;
}

export interface TeamRegistrationMemberInput {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
}

export interface TeamRegistrationForm {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  phone: string;
  department: string;
  year: string;
  college: string;
  challengeId?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  members: TeamRegistrationMemberInput[];
  pptFile?: File | null;
}
