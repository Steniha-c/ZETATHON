import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { HACKATHON_CONFIG, HackathonConfig, Challenge, TimelineItem, PrizeItem, FaqItem } from '../hackathon.config.js';
import { Team, Submission, Announcement, UserProfile, TeamStatus } from '../types/index.js';

let supabase: SupabaseClient | null = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase Client initialized with Service Role Key');
  } catch (err) {
    console.warn('⚠️ Supabase Client init error, falling back to local memory store:', err);
  }
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Sequential promise chain to serialize concurrent file writes and prevent JSON corruption
let writeQueuePromise: Promise<void> = Promise.resolve();

function persistRegistrationsSync(teams: Team[]) {
  try {
    ensureDataDir();
    const content = JSON.stringify(teams, null, 2);
    fs.writeFileSync(REGISTRATIONS_FILE, content, 'utf-8');
  } catch (err) {
    console.warn('Could not persist registrations to disk:', err);
  }
}

async function persistRegistrationsAsync(teams: Team[]): Promise<void> {
  writeQueuePromise = writeQueuePromise.then(async () => {
    persistRegistrationsSync(teams);
  });
  return writeQueuePromise;
}

// In-memory data store as fallback / fast cache
class DataStore {
  public config: HackathonConfig = JSON.parse(JSON.stringify(HACKATHON_CONFIG));
  public users: Map<string, UserProfile & { passwordHash?: string }> = new Map();
  public teams: Map<string, Team> = new Map();
  public submissions: Map<string, Submission> = new Map();
  public announcements: Announcement[] = [];

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // 1. Configure the Exclusive Administrator Account
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'zeta.ecell.dce@gmail.com').trim().toLowerCase();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'zetadce2444666668888888';

    const adminUser: UserProfile = {
      id: 'usr-admin-zeta-ecell',
      email: adminEmail,
      fullName: 'ZETA E-Cell DCE Lead',
      role: 'admin',
      college: 'Dronacharya College of Engineering',
      department: 'E-Cell Core Team',
      year: 'Core Admin',
      createdAt: new Date().toISOString(),
    };
    const adminPassHash = bcrypt.hashSync(adminPassword, 10);
    this.users.set(adminEmail, { ...adminUser, passwordHash: adminPassHash });
    console.log(`🔒 Administrator portal configured exclusively for: ${adminEmail}`);

    // No fake teams, fake participants, or fake submissions are seeded.
    // Only real registered teams submitted via the registration form are loaded.
    this.teams.clear();
    this.submissions.clear();

    // Initial Announcements
    this.announcements = [
      {
        id: 'ann-01',
        title: 'Welcome to ZETATHON 2026! 🚀',
        content: 'Registration is officially underway. Make sure all your team members verify their email IDs and review the challenge track guidelines.',
        category: 'general',
        isImportant: true,
        authorName: 'ZETA E-Cell DCE',
        createdAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
      },
      {
        id: 'ann-02',
        title: 'WiFi & Lab Access Credentials',
        content: 'High-speed SSID "ZETATHON-INNOVATION-5G" credentials will be distributed at check-in desks in Block 4. Mentors and organizers are stationed at the ZETA Innovation Hub.',
        category: 'alert',
        isImportant: false,
        authorName: 'Tech Ops Team',
        createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
      {
        id: 'ann-03',
        title: 'Submission Guidelines Reminder',
        content: 'Submissions strictly close at 05:00 PM. Teams must provide a public GitHub repo link and a 2-3 minute video or live deploy link. No late extensions!',
        category: 'milestone',
        isImportant: true,
        authorName: 'Jury Coordinator',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
    ];

    // Load actual registered teams from disk (ignoring any legacy fake demo teams)
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      try {
        const raw = fs.readFileSync(REGISTRATIONS_FILE, 'utf-8');
        const savedTeams: Team[] = JSON.parse(raw);
        if (Array.isArray(savedTeams)) {
          savedTeams.forEach(t => {
            // Only load actual registered teams, skip any legacy mock IDs or temporary test names
            if (
              !t.id.startsWith('team-zeta-') &&
              !t.name.startsWith('AlphaShield_') &&
              !t.name.startsWith('QuantumShift_') &&
              !t.name.startsWith('RaceConditionSquad_') &&
              !t.name.startsWith('WrongOtpTeam_') &&
              !t.name.startsWith('CooldownTeam_') &&
              !t.name.startsWith('UnverifiedTeam_') &&
              !t.name.startsWith('TitanPulse_') &&
              !t.name.startsWith('SpoofTeam_') &&
              !t.name.startsWith('SoloSquad_') &&
              !t.name.startsWith('OversizedSquad_')
            ) {
              if (!t.registrationId) {
                t.registrationId = t.teamCode || `ZETA-2026-${t.id.slice(-6).toUpperCase()}`;
              }
              if (!t.auditLog) {
                t.auditLog = [];
              }
              if (!t.emailStatus) {
                t.emailStatus = {
                  registrationEmail: { status: 'sent', sentAt: t.createdAt },
                  selectionEmail: { status: 'not_sent' },
                };
              }
              this.teams.set(t.id, t);
            }
          });
        }
      } catch (err) {
        console.warn('Could not read existing registrations file:', err);
      }
    }
    persistRegistrationsSync(Array.from(this.teams.values()));
  }
}

export const dbStore = new DataStore();

export const db = {
  // Config & Content
  getConfig: async (): Promise<HackathonConfig> => {
    return dbStore.config;
  },

  updateConfig: async (newConfig: Partial<HackathonConfig>): Promise<HackathonConfig> => {
    dbStore.config = { ...dbStore.config, ...newConfig };
    return dbStore.config;
  },

  // Challenges
  getChallenges: async (): Promise<Challenge[]> => {
    return dbStore.config.challenges;
  },

  getChallengeById: async (id: string): Promise<Challenge | undefined> => {
    return dbStore.config.challenges.find(c => c.id === id || c.code === id);
  },

  saveChallenge: async (challenge: Challenge): Promise<Challenge> => {
    const idx = dbStore.config.challenges.findIndex(c => c.id === challenge.id);
    if (idx >= 0) {
      dbStore.config.challenges[idx] = challenge;
    } else {
      dbStore.config.challenges.push(challenge);
    }
    return challenge;
  },

  deleteChallenge: async (id: string): Promise<boolean> => {
    const initialLen = dbStore.config.challenges.length;
    dbStore.config.challenges = dbStore.config.challenges.filter(c => c.id !== id);
    return dbStore.config.challenges.length < initialLen;
  },

  // Timeline
  getTimeline: async (): Promise<TimelineItem[]> => {
    return dbStore.config.timeline;
  },

  saveTimelineItem: async (item: TimelineItem): Promise<TimelineItem> => {
    const idx = dbStore.config.timeline.findIndex(t => t.id === item.id);
    if (idx >= 0) {
      dbStore.config.timeline[idx] = item;
    } else {
      dbStore.config.timeline.push(item);
    }
    return item;
  },

  deleteTimelineItem: async (id: string): Promise<boolean> => {
    const initialLen = dbStore.config.timeline.length;
    dbStore.config.timeline = dbStore.config.timeline.filter(t => t.id !== id);
    return dbStore.config.timeline.length < initialLen;
  },

  // Prizes
  getPrizes: async () => {
    return dbStore.config.prizes;
  },

  // FAQs
  getFaqs: async (): Promise<FaqItem[]> => {
    return dbStore.config.faqs;
  },

  saveFaq: async (faq: FaqItem): Promise<FaqItem> => {
    const idx = dbStore.config.faqs.findIndex(f => f.id === faq.id);
    if (idx >= 0) {
      dbStore.config.faqs[idx] = faq;
    } else {
      dbStore.config.faqs.push(faq);
    }
    return faq;
  },

  deleteFaq: async (id: string): Promise<boolean> => {
    const initialLen = dbStore.config.faqs.length;
    dbStore.config.faqs = dbStore.config.faqs.filter(f => f.id !== id);
    return dbStore.config.faqs.length < initialLen;
  },

  // Announcements
  getAnnouncements: async (): Promise<Announcement[]> => {
    return dbStore.announcements;
  },

  addAnnouncement: async (ann: Announcement): Promise<Announcement> => {
    dbStore.announcements.unshift(ann);
    return ann;
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
    const idx = dbStore.announcements.findIndex(a => a.id === id);
    if (idx < 0) return null;
    dbStore.announcements[idx] = { ...dbStore.announcements[idx], ...updates };
    return dbStore.announcements[idx];
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    const initialLen = dbStore.announcements.length;
    dbStore.announcements = dbStore.announcements.filter(a => a.id !== id);
    return dbStore.announcements.length < initialLen;
  },

  // Users
  getUserByEmail: async (email: string) => {
    if (!email) return undefined;
    return dbStore.users.get(email.trim().toLowerCase());
  },

  getUserById: async (id: string) => {
    for (const user of dbStore.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },

  saveUser: async (user: UserProfile & { passwordHash?: string }) => {
    const normalizedEmail = user.email.trim().toLowerCase();
    let safeHash = user.passwordHash;
    // Automatically hash password if it is plaintext
    if (safeHash && !safeHash.startsWith('$2a$') && !safeHash.startsWith('$2b$')) {
      safeHash = bcrypt.hashSync(safeHash, 10);
    }
    const record = { ...user, email: normalizedEmail, passwordHash: safeHash };
    dbStore.users.set(normalizedEmail, record);
    return record;
  },

  // Teams
  getTeams: async (): Promise<Team[]> => {
    return Array.from(dbStore.teams.values());
  },

  getTeamById: async (id: string): Promise<Team | undefined> => {
    return dbStore.teams.get(id);
  },

  getTeamByName: async (name: string): Promise<Team | undefined> => {
    if (!name) return undefined;
    const target = name.trim().toLowerCase();
    for (const team of dbStore.teams.values()) {
      if (team.name.trim().toLowerCase() === target) {
        return team;
      }
    }
    return undefined;
  },

  getTeamByUserIdOrEmail: async (userIdOrEmail: string): Promise<Team | undefined> => {
    if (!userIdOrEmail) return undefined;
    const target = userIdOrEmail.trim().toLowerCase();
    for (const team of dbStore.teams.values()) {
      if (team.leaderId === userIdOrEmail || (team.leaderEmail && team.leaderEmail.trim().toLowerCase() === target)) {
        return team;
      }
      if (Array.isArray(team.members) && team.members.some(m => m.email && m.email.trim().toLowerCase() === target)) {
        return team;
      }
    }
    return undefined;
  },

  isEmailRegisteredInAnyTeam: async (email: string, excludeTeamId?: string): Promise<{ registered: boolean; teamName?: string; role?: string }> => {
    if (!email) return { registered: false };
    const target = email.trim().toLowerCase();
    for (const team of dbStore.teams.values()) {
      if (excludeTeamId && team.id === excludeTeamId) continue;
      // Do not consider rejected teams as blocking email re-registration
      if (team.status === 'rejected') continue;

      if (team.leaderEmail && team.leaderEmail.trim().toLowerCase() === target) {
        return { registered: true, teamName: team.name, role: 'Team Leader' };
      }
      if (Array.isArray(team.members)) {
        const found = team.members.find(m => m.email && m.email.trim().toLowerCase() === target);
        if (found) {
          return { registered: true, teamName: team.name, role: 'Team Member' };
        }
      }
    }
    return { registered: false };
  },

  getTeamByRegistrationId: async (regId: string): Promise<Team | undefined> => {
    if (!regId) return undefined;
    const target = regId.trim().toUpperCase();
    for (const team of dbStore.teams.values()) {
      if (team.registrationId && team.registrationId.trim().toUpperCase() === target) {
        return team;
      }
    }
    return undefined;
  },

  createTeam: async (team: Team): Promise<Team> => {
    if (!team.auditLog) team.auditLog = [];
    if (!team.emailStatus) {
      team.emailStatus = {
        registrationEmail: { status: 'sent', sentAt: new Date().toISOString() },
        selectionEmail: { status: 'not_sent' },
      };
    }
    dbStore.teams.set(team.id, team);
    await persistRegistrationsAsync(Array.from(dbStore.teams.values()));
    return team;
  },

  updateTeam: async (id: string, updates: Partial<Team>): Promise<Team | null> => {
    const existing = dbStore.teams.get(id);
    if (!existing) return null;

    let updatedAuditLog = updates.auditLog || existing.auditLog || [];
    if (updates.status && updates.status !== existing.status) {
      const auditEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        changedBy: updates.approvedBy || 'organizer',
        previousStatus: existing.status,
        newStatus: updates.status,
        reason: updates.rejectionReason,
      };
      updatedAuditLog = [auditEntry, ...updatedAuditLog];
    }

    const updated = {
      ...existing,
      ...updates,
      auditLog: updatedAuditLog,
      updatedAt: new Date().toISOString(),
    };
    dbStore.teams.set(id, updated);
    await persistRegistrationsAsync(Array.from(dbStore.teams.values()));
    return updated;
  },

  deleteTeam: async (id: string): Promise<boolean> => {
    const deleted = dbStore.teams.delete(id);
    dbStore.submissions.delete(id);
    await persistRegistrationsAsync(Array.from(dbStore.teams.values()));
    return deleted;
  },

  // Submissions
  getSubmissions: async (): Promise<Submission[]> => {
    return Array.from(dbStore.submissions.values());
  },

  getSubmissionByTeamId: async (teamId: string): Promise<Submission | undefined> => {
    return dbStore.submissions.get(teamId);
  },

  saveSubmission: async (sub: Submission): Promise<Submission> => {
    dbStore.submissions.set(sub.teamId, sub);
    return sub;
  },

  gradeSubmission: async (teamId: string, score: number, feedback?: string): Promise<Submission | null> => {
    const existing = dbStore.submissions.get(teamId);
    if (!existing) return null;
    const updated: Submission = {
      ...existing,
      score,
      feedback,
      status: 'evaluated',
      updatedAt: new Date().toISOString(),
    };
    dbStore.submissions.set(teamId, updated);
    return updated;
  },
};
