import { HACKATHON_CONFIG, HackathonConfig, Challenge, TimelineItem, FaqItem, PrizeItem } from '../hackathon.config.js';
import { UserProfile, Team, Submission, Announcement, TeamRegistrationForm } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('zetathon_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err: any) {
    console.warn(`API call error for ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // Config & Public Data
  async getConfig(): Promise<HackathonConfig> {
    try {
      const res = await fetchJSON<{ success: boolean; data: HackathonConfig }>('/config');
      return res.data;
    } catch {
      return HACKATHON_CONFIG;
    }
  },

  async getStats() {
    try {
      const res = await fetchJSON<{ success: boolean; data: any }>('/stats');
      return res.data;
    } catch {
      return {
        hours: HACKATHON_CONFIG.stats.hours,
        teamsCount: 35,
        teamsDisplay: HACKATHON_CONFIG.stats.teams,
        challengesCount: HACKATHON_CONFIG.challenges.length,
        prizePool: HACKATHON_CONFIG.stats.prizePool,
        participantsCount: 140,
        submissionsCount: 28,
      };
    }
  },

  async getChallenges(): Promise<Challenge[]> {
    try {
      const res = await fetchJSON<{ success: boolean; data: Challenge[] }>('/challenges');
      return res.data;
    } catch {
      return HACKATHON_CONFIG.challenges;
    }
  },

  async getTimeline(): Promise<TimelineItem[]> {
    try {
      const res = await fetchJSON<{ success: boolean; data: TimelineItem[] }>('/timeline');
      return res.data;
    } catch {
      return HACKATHON_CONFIG.timeline;
    }
  },

  async getPrizes(): Promise<PrizeItem[]> {
    try {
      const res = await fetchJSON<{ success: boolean; data: PrizeItem[] }>('/prizes');
      return res.data;
    } catch {
      return HACKATHON_CONFIG.prizes;
    }
  },

  async getFaqs(): Promise<FaqItem[]> {
    try {
      const res = await fetchJSON<{ success: boolean; data: FaqItem[] }>('/faqs');
      return res.data;
    } catch {
      return HACKATHON_CONFIG.faqs;
    }
  },

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await fetchJSON<{ success: boolean; data: Announcement[] }>('/announcements');
      return res.data;
    } catch {
      return [
        {
          id: 'ann-init-1',
          title: 'Welcome to ZETATHON 2026! 🚀',
          content: 'Registration is officially open. Review challenge briefs and register your team.',
          category: 'general',
          isImportant: true,
          authorName: 'ZETA Lead Core',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  // Auth
  async login(credentials: { email: string; password: string }) {
    return fetchJSON<{
      success: boolean;
      token: string;
      user: UserProfile;
      team: Team | null;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(data: any) {
    return fetchJSON<{
      success: boolean;
      token: string;
      user: UserProfile;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return fetchJSON<{
      success: boolean;
      user: UserProfile;
      team: Team | null;
      submission: Submission | null;
    }>('/auth/me');
  },

  async forgotPassword(email: string) {
    return fetchJSON<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Team Registration (Supports FormData for PPT file upload or JSON)
  async registerTeam(formData: TeamRegistrationForm | FormData) {
    if (formData instanceof FormData) {
      const token = localStorage.getItem('zetathon_token');
      const res = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      return data;
    }

    return fetchJSON<{
      success: boolean;
      registrationId?: string;
      message: string;
      team?: Team;
      error?: string;
    }>('/teams', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  async getMyTeam() {
    return fetchJSON<{ success: boolean; team: Team }>('/teams/my-team');
  },

  // Submissions
  async submitProject(submissionData: {
    projectTitle: string;
    projectDescription: string;
    githubUrl: string;
    demoUrl?: string;
    videoUrl?: string;
    remarks?: string;
  }) {
    return fetchJSON<{
      success: boolean;
      message: string;
      submission: Submission;
    }>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  async getMySubmission() {
    return fetchJSON<{ success: boolean; submission: Submission | null }>('/submissions/my-submission');
  },

  // Admin Endpoints
  admin: {
    async getOverview() {
      return fetchJSON<{ success: boolean; data: any }>('/admin/overview');
    },

    async getTeams(params: { search?: string; status?: string; challenge?: string } = {}) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.status) searchParams.append('status', params.status);
      if (params.challenge) searchParams.append('challenge', params.challenge);
      const queryStr = searchParams.toString();
      return fetchJSON<{ success: boolean; count: number; teams: Team[] }>(
        `/admin/teams${queryStr ? `?${queryStr}` : ''}`
      );
    },

    async updateTeamStatus(
      id: string,
      statusOrPayload: string | { status: string; reason?: string; notifyLeader?: boolean }
    ) {
      const body = typeof statusOrPayload === 'string'
        ? { status: statusOrPayload }
        : statusOrPayload;

      return fetchJSON<{ success: boolean; message: string; team: Team }>(
        `/admin/teams/${id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      );
    },

    async downloadPPT(teamId: string, filename = 'presentation.pdf') {
      const token = localStorage.getItem('zetathon_token');
      const res = await fetch(`${API_BASE}/admin/teams/${teamId}/ppt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to download project presentation.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },

    async deleteTeam(id: string) {
      return fetchJSON<{ success: boolean; message: string }>(`/admin/teams/${id}`, {
        method: 'DELETE',
      });
    },

    async getParticipants() {
      return fetchJSON<{ success: boolean; count: number; participants: any[] }>('/admin/participants');
    },

    async getSubmissions() {
      return fetchJSON<{ success: boolean; count: number; submissions: Submission[] }>('/admin/submissions');
    },

    async gradeSubmission(teamId: string, score: number, feedback?: string) {
      return fetchJSON<{ success: boolean; submission: Submission }>(
        `/admin/submissions/${teamId}/grade`,
        {
          method: 'PUT',
          body: JSON.stringify({ score, feedback }),
        }
      );
    },

    async createAnnouncement(data: { title: string; content: string; category?: string; isImportant?: boolean }) {
      return fetchJSON<{ success: boolean; announcement: Announcement }>('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAnnouncement(id: string, data: Partial<Announcement>) {
      return fetchJSON<{ success: boolean; announcement: Announcement }>(`/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAnnouncement(id: string) {
      return fetchJSON<{ success: boolean; deleted: boolean }>(`/admin/announcements/${id}`, {
        method: 'DELETE',
      });
    },

    async updateConfig(newConfig: Partial<HackathonConfig>) {
      return fetchJSON<{ success: boolean; message: string; config: HackathonConfig }>('/admin/config', {
        method: 'PUT',
        body: JSON.stringify(newConfig),
      });
    },

    async saveChallenge(challenge: Challenge) {
      return fetchJSON<{ success: boolean; challenge: Challenge }>('/admin/challenges', {
        method: 'POST',
        body: JSON.stringify(challenge),
      });
    },

    async deleteChallenge(id: string) {
      return fetchJSON<{ success: boolean; deleted: boolean }>(`/admin/challenges/${id}`, {
        method: 'DELETE',
      });
    },

    async saveTimelineItem(item: TimelineItem) {
      return fetchJSON<{ success: boolean; timelineItem: TimelineItem }>('/admin/timeline', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },

    async deleteTimelineItem(id: string) {
      return fetchJSON<{ success: boolean; deleted: boolean }>(`/admin/timeline/${id}`, {
        method: 'DELETE',
      });
    },

    async saveFaq(faq: FaqItem) {
      return fetchJSON<{ success: boolean; faq: FaqItem }>('/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(faq),
      });
    },

    async deleteFaq(id: string) {
      return fetchJSON<{ success: boolean; deleted: boolean }>(`/admin/faqs/${id}`, {
        method: 'DELETE',
      });
    },

    async exportCSV() {
      const token = localStorage.getItem('zetathon_token');
      const res = await fetch(`${API_BASE}/admin/export?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zetathon_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  },
};
