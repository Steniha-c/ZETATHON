import { Response } from 'express';
import { db } from '../services/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Challenge, TimelineItem, FaqItem, PrizeItem } from '../hackathon.config.js';
import { Announcement, TeamStatus, Team } from '../types/index.js';

export const adminController = {
  async getOverview(req: AuthRequest, res: Response) {
    try {
      const teams = await db.getTeams();
      const submissions = await db.getSubmissions();
      const announcements = await db.getAnnouncements();
      const config = await db.getConfig();

      let totalParticipants = 0;
      let pptSubmissions = 0;
      const challengeCounts: Record<string, number> = {};

      teams.forEach(t => {
        totalParticipants += 1 + (t.members?.length || 0);
        if (t.pptFile) pptSubmissions++;
        const code = t.challengeCode || 'Open Track';
        challengeCounts[code] = (challengeCounts[code] || 0) + 1;
      });

      const pendingReviewTeams = teams.filter(t =>
        ['pending_review', 'pending_approval', 'pending', 'pending_verification'].includes(t.status)
      ).length;

      const shortlistedTeams = teams.filter(t =>
        ['shortlisted', 'approved'].includes(t.status)
      ).length;

      const waitlistedTeams = teams.filter(t => t.status === 'waitlisted').length;

      const notShortlistedTeams = teams.filter(t =>
        ['not_shortlisted', 'rejected'].includes(t.status)
      ).length;

      return res.json({
        success: true,
        data: {
          totalTeams: teams.length,
          totalParticipants,
          pptSubmissions,
          pendingReviewTeams,
          shortlistedTeams,
          waitlistedTeams,
          notShortlistedTeams,
          // Legacy mappings for backwards-compatibility
          approvedTeams: shortlistedTeams,
          pendingTeams: pendingReviewTeams,
          totalSubmissions: submissions.length,
          totalAnnouncements: announcements.length,
          challengeCounts,
          dates: config.dates,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to generate overview statistics.' });
    }
  },

  async getTeams(req: AuthRequest, res: Response) {
    try {
      const { search, status, challenge } = req.query;
      let teams = await db.getTeams();

      if (search && typeof search === 'string') {
        const query = search.toLowerCase().trim();
        teams = teams.filter(
          t =>
            t.name.toLowerCase().includes(query) ||
            (t.registrationId && t.registrationId.toLowerCase().includes(query)) ||
            (t.teamCode && t.teamCode.toLowerCase().includes(query)) ||
            t.leaderName.toLowerCase().includes(query) ||
            t.leaderEmail.toLowerCase().includes(query) ||
            (t.phone && t.phone.toLowerCase().includes(query)) ||
            (t.college && t.college.toLowerCase().includes(query)) ||
            t.members.some(
              m =>
                m.name.toLowerCase().includes(query) ||
                m.email.toLowerCase().includes(query) ||
                (m.phone && m.phone.toLowerCase().includes(query))
            )
        );
      }

      if (status && typeof status === 'string' && status !== 'all') {
        if (status === 'pending_review') {
          teams = teams.filter(t =>
            ['pending_review', 'pending_approval', 'pending', 'pending_verification'].includes(t.status)
          );
        } else if (status === 'shortlisted') {
          teams = teams.filter(t => ['shortlisted', 'approved'].includes(t.status));
        } else if (status === 'not_shortlisted') {
          teams = teams.filter(t => ['not_shortlisted', 'rejected'].includes(t.status));
        } else {
          teams = teams.filter(t => t.status === status);
        }
      }

      if (challenge && typeof challenge === 'string' && challenge !== 'all') {
        teams = teams.filter(t => t.challengeId === challenge || t.challengeCode === challenge);
      }

      return res.json({ success: true, count: teams.length, teams });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve teams.' });
    }
  },

  async updateTeamStatus(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const { status, reason, notifyLeader = true } = req.body;

      const allowedStatuses: TeamStatus[] = [
        'pending_review',
        'shortlisted',
        'waitlisted',
        'not_shortlisted',
        'approved',
        'rejected',
        'pending_approval',
        'pending',
        'pending_verification',
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid team selection status value.' });
      }

      const existingTeam = await db.getTeamById(id) || await db.getTeamByRegistrationId(id);
      if (!existingTeam) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      // Check if status is actually changing
      const isStatusChanged = existingTeam.status !== status;
      if (!isStatusChanged) {
        return res.json({
          success: true,
          message: `Team is already in status '${status}'. Status unchanged.`,
          team: existingTeam,
        });
      }

      const updates: Partial<Team> = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'shortlisted' || status === 'approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = req.user?.id || req.user?.email || 'admin';
      } else if (status === 'not_shortlisted' || status === 'rejected' || status === 'waitlisted') {
        if (reason) updates.rejectionReason = String(reason);
      }

      const updated = await db.updateTeam(existingTeam.id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      return res.json({
        success: true,
        message: `Team status successfully updated to '${status}'.`,
        team: updated,
      });
    } catch (err: any) {
      console.error('Admin updateTeamStatus error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update team status.' });
    }
  },

  /**
   * Authorized Organizer Email Delivery (Disabled - emails removed)
   */
  async resendNotificationEmail(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      message: 'Email notifications are disabled per hackathon policy.',
    });
  },

  async deleteTeam(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const team = await db.getTeamById(id) || await db.getTeamByRegistrationId(id);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }
      await db.deleteTeam(team.id);
      return res.json({ success: true, message: 'Team successfully removed.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to delete team.' });
    }
  },

  async getParticipants(req: AuthRequest, res: Response) {
    try {
      const teams = await db.getTeams();
      const participants: any[] = [];

      teams.forEach(t => {
        // Leader
        participants.push({
          id: `lead-${t.id}`,
          name: t.leaderName,
          email: t.leaderEmail,
          phone: t.phone,
          department: t.department,
          year: t.year,
          college: t.college,
          teamName: t.name,
          teamId: t.id,
          registrationId: t.registrationId || t.teamCode,
          role: 'Team Leader',
          status: t.status,
        });

        // Members
        if (Array.isArray(t.members)) {
          t.members.forEach((m, idx) => {
            participants.push({
              id: m.id || `mem-${t.id}-${idx}`,
              name: m.name,
              email: m.email,
              phone: m.phone || 'N/A',
              department: m.department || t.department,
              year: m.year || t.year,
              college: m.college || t.college,
              teamName: t.name,
              teamId: t.id,
              registrationId: t.registrationId || t.teamCode,
              role: 'Member',
              status: t.status,
            });
          });
        }
      });

      return res.json({ success: true, count: participants.length, participants });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve participants.' });
    }
  },

  async getSubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await db.getSubmissions();
      return res.json({ success: true, count: submissions.length, submissions });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve submissions.' });
    }
  },

  async gradeSubmission(req: AuthRequest, res: Response) {
    try {
      const teamId = String(req.params.teamId);
      const { score, feedback } = req.body;

      if (typeof score !== 'number' || score < 0 || score > 100) {
        return res.status(400).json({ success: false, error: 'Score must be a number between 0 and 100.' });
      }

      const updated = await db.gradeSubmission(teamId, score, feedback);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Submission not found for this team.' });
      }

      return res.json({ success: true, message: 'Submission evaluated successfully.', submission: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to grade submission.' });
    }
  },

  // Announcements
  async createAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { title, content, category = 'general', isImportant = false } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required.' });
      }

      const ann: Announcement = {
        id: `ann-${Date.now()}`,
        title,
        content,
        category,
        isImportant: Boolean(isImportant),
        authorName: req.user?.fullName || 'ZETA Organizing Core',
        createdAt: new Date().toISOString(),
      };

      await db.addAnnouncement(ann);
      return res.status(201).json({ success: true, announcement: ann });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to create announcement.' });
    }
  },

  async updateAnnouncement(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const updated = await db.updateAnnouncement(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Announcement not found.' });
      }
      return res.json({ success: true, announcement: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to update announcement.' });
    }
  },

  async deleteAnnouncement(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await db.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Announcement not found.' });
      }
      return res.json({ success: true, deleted: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to delete announcement.' });
    }
  },

  // CMS
  async updateConfig(req: AuthRequest, res: Response) {
    try {
      const updatedConfig = await db.updateConfig(req.body);
      return res.json({ success: true, message: 'Hackathon configuration saved.', config: updatedConfig });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to update configuration.' });
    }
  },

  async saveChallenge(req: AuthRequest, res: Response) {
    try {
      const saved = await db.saveChallenge(req.body);
      return res.json({ success: true, challenge: saved });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to save challenge track.' });
    }
  },

  async deleteChallenge(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await db.deleteChallenge(id);
      return res.json({ success: true, deleted });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to delete challenge.' });
    }
  },

  async saveTimelineItem(req: AuthRequest, res: Response) {
    try {
      const saved = await db.saveTimelineItem(req.body);
      return res.json({ success: true, timelineItem: saved });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to save timeline milestone.' });
    }
  },

  async deleteTimelineItem(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await db.deleteTimelineItem(id);
      return res.json({ success: true, deleted });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to delete timeline milestone.' });
    }
  },

  async saveFaq(req: AuthRequest, res: Response) {
    try {
      const saved = await db.saveFaq(req.body);
      return res.json({ success: true, faq: saved });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to save FAQ item.' });
    }
  },

  async deleteFaq(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await db.deleteFaq(id);
      return res.json({ success: true, deleted });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to delete FAQ.' });
    }
  },

  // Export CSV
  async exportData(req: AuthRequest, res: Response) {
    try {
      const { format } = req.query;
      const teams = await db.getTeams();
      const submissions = await db.getSubmissions();

      if (format === 'csv') {
        const headers = [
          'Registration ID',
          'Team ID',
          'Team Name',
          'Team Code',
          'Selection Status',
          'Track Code',
          'Leader Name',
          'Leader Email',
          'Leader Phone',
          'College',
          'Department',
          'Academic Year',
          'Total Members',
          'Member Names',
          'PPT Submitted',
          'PPT File Name',
          'PPT Size MB',
          'Registration Email Status',
          'Selection Email Status',
          'Registered At',
        ];

        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        const rows = teams.map(t => {
          const membersList = (t.members || []).map(m => `${m.name} (${m.email})`).join('; ');
          const hasPPT = !!t.pptFile;
          const pptName = t.pptFile?.originalName || 'None';
          const pptSize = t.pptFile ? (t.pptFile.sizeBytes / (1024 * 1024)).toFixed(2) : '0';
          const regEmail = t.emailStatus?.registrationEmail?.status || 'N/A';
          const selEmail = t.emailStatus?.selectionEmail?.status || 'N/A';

          return [
            escapeCSV(t.registrationId || t.teamCode),
            escapeCSV(t.id),
            escapeCSV(t.name),
            escapeCSV(t.teamCode),
            escapeCSV(t.status),
            escapeCSV(t.challengeCode || 'Open Track'),
            escapeCSV(t.leaderName),
            escapeCSV(t.leaderEmail),
            escapeCSV(t.phone),
            escapeCSV(t.college),
            escapeCSV(t.department),
            escapeCSV(t.year),
            1 + (t.members ? t.members.length : 0),
            escapeCSV(membersList),
            escapeCSV(hasPPT ? 'Yes' : 'No'),
            escapeCSV(pptName),
            pptSize,
            escapeCSV(regEmail),
            escapeCSV(selEmail),
            escapeCSV(t.createdAt),
          ];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="zetathon_registrations_${new Date().toISOString().slice(0, 10)}.csv"`
        );
        return res.send(csvContent);
      }

      return res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        teams,
        submissions,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to export data.' });
    }
  },
};
