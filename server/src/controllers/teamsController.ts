import { Response } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { db } from '../services/db.js';
import { signToken, AuthRequest } from '../middleware/auth.js';
import { Team, TeamMember, TeamStatus, PPTFileMetadata } from '../types/index.js';
import {
  inspectFileMagicBytes,
  saveUploadedPPT,
  getUploadedFilePath,
  MAX_FILE_SIZE_BYTES,
} from '../services/fileUploadService.js';

const memberSchema = z.object({
  name: z.string().min(2, 'Member name is required'),
  email: z.string().email('Valid member email is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').optional().or(z.literal('')),
  college: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
});

const teamRegistrationSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters'),
  leaderName: z.string().min(2, 'Team leader name is required'),
  leaderEmail: z.string().email('Valid leader email is required'),
  phone: z.string().min(10, 'Valid contact phone number is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.string().min(1, 'Academic year is required'),
  college: z.string().min(2, 'College / Institution name is required'),
  challengeId: z.string().optional(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  members: z.array(memberSchema).min(1, 'At least 1 additional team member required (2-4 total)').max(3, 'Maximum 3 additional team members (4 total)'),
});

// Mutex lock to serialize critical database verification writes and prevent race conditions
let registrationLock: Promise<any> = Promise.resolve();

function generateSecureTeamCode(teamName: string): string {
  const cleanPrefix = (teamName.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') || 'ZETA').padEnd(4, 'X');
  const secureRandom = crypto.randomInt(1000, 10000);
  return `ZETA-${cleanPrefix}-${secureRandom}`;
}

function generateRegistrationId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `ZETA-2026-${code}`;
}

export const teamsController = {
  /**
   * Direct Team Registration (Simplified 1-step workflow, no email verification required).
   * Validates details, validates & stores PPT presentation, persists to database, and issues participant session.
   */
  async registerTeam(req: AuthRequest, res: Response) {
    try {
      let bodyData = { ...req.body };

      // Parse members if provided as a JSON string (via FormData)
      if (typeof bodyData.members === 'string') {
        try {
          bodyData.members = JSON.parse(bodyData.members);
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Invalid JSON format for team members roster.',
          });
        }
      }

      // Check member count limits
      if (Array.isArray(bodyData.members)) {
        if (bodyData.members.length < 1) {
          return res.status(400).json({
            success: false,
            error: 'At least 1 additional team member is required (minimum 2 members total).',
          });
        }
        if (bodyData.members.length > 3) {
          return res.status(400).json({
            success: false,
            error: 'A maximum of 3 additional team members are allowed (maximum 4 members total).',
          });
        }
      }

      const parsed = teamRegistrationSchema.safeParse(bodyData);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Form validation failed',
          details: parsed.error.format(),
        });
      }

      const data = parsed.data;
      const normalizedLeaderEmail = data.leaderEmail.trim().toLowerCase();
      const normalizedTeamName = data.teamName.trim().toLowerCase();

      // Check internal duplicate emails among leader and members
      const memberEmails = data.members.map(m => m.email.trim().toLowerCase());
      if (memberEmails.includes(normalizedLeaderEmail)) {
        return res.status(409).json({
          success: false,
          error: 'Team member cannot have the same email address as the Team Leader.',
        });
      }

      const uniqueMemberEmails = new Set(memberEmails);
      if (uniqueMemberEmails.size !== memberEmails.length) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate team member emails detected in the registration roster.',
        });
      }

      // Handle PPT File Upload if provided
      let pptFileMetadata: PPTFileMetadata | undefined;
      if (req.file) {
        if (req.file.size > MAX_FILE_SIZE_BYTES) {
          return res.status(400).json({
            success: false,
            error: 'Uploaded project presentation exceeds 25 MB limit.',
          });
        }

        const magicCheck = inspectFileMagicBytes(req.file.buffer);
        if (!magicCheck.valid) {
          return res.status(400).json({
            success: false,
            error: magicCheck.error || 'Invalid file format: Actual file binary content does not match a valid PDF, PPTX, or PPT presentation.',
          });
        }

        pptFileMetadata = saveUploadedPPT(req.file.buffer, req.file.originalname, magicCheck.type);
      }

      return await (registrationLock = registrationLock.then(async () => {
        // Check duplicate team name in database
        const duplicateTeam = await db.getTeamByName(normalizedTeamName);
        if (duplicateTeam && duplicateTeam.status !== 'rejected' && duplicateTeam.status !== 'not_shortlisted') {
          return res.status(409).json({
            success: false,
            error: `A team named "${data.teamName}" is already registered. Please choose another name.`,
          });
        }

        // Check if leader email is already registered in another active/pending team
        const leaderCheck = await db.isEmailRegisteredInAnyTeam(normalizedLeaderEmail);
        if (leaderCheck.registered) {
          return res.status(409).json({
            success: false,
            error: `The leader email address (${normalizedLeaderEmail}) is already registered in team "${leaderCheck.teamName}".`,
          });
        }

        // Check if any member email is already registered in another active/pending team
        for (const m of data.members) {
          const normMemberEmail = m.email.trim().toLowerCase();
          const memberCheck = await db.isEmailRegisteredInAnyTeam(normMemberEmail);
          if (memberCheck.registered) {
            return res.status(409).json({
              success: false,
              error: `Team member email (${normMemberEmail}) is already registered in team "${memberCheck.teamName}".`,
            });
          }
        }

        const registrationId = generateRegistrationId();
        const teamId = `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const teamCode = generateSecureTeamCode(data.teamName);

        // Fetch challenge details (defaults to Open Innovation Track)
        let resolvedChallengeId = data.challengeId || 'open-innovation';
        let challengeTitle = 'Open Innovation Track';
        let challengeCode = 'OPEN-INNOVATION';
        const ch = (await db.getChallengeById(resolvedChallengeId)) || (await db.getChallenges())[0];
        if (ch) {
          resolvedChallengeId = ch.id;
          challengeTitle = ch.title;
          challengeCode = ch.code;
        }

        // Format members list
        const formattedMembers: TeamMember[] = data.members.map((m: any, idx: number) => ({
          id: `mem-${Date.now()}-${idx + 1}`,
          name: m.name.trim(),
          email: m.email.trim().toLowerCase(),
          phone: m.phone ? m.phone.trim() : undefined,
          college: m.college || data.college,
          department: m.department || data.department,
          year: m.year || data.year,
          role: 'Member',
        }));

        // Find or create leader user account with hashed password
        let leaderUser = await db.getUserByEmail(normalizedLeaderEmail);
        if (!leaderUser) {
          const defaultPassword = 'zeta' + crypto.randomInt(1000, 9999);
          leaderUser = {
            id: req.user?.id || `usr-lead-${Date.now()}`,
            email: normalizedLeaderEmail,
            fullName: data.leaderName.trim(),
            phone: data.phone.trim(),
            department: data.department,
            year: data.year,
            college: data.college,
            githubUrl: data.githubUrl || undefined,
            linkedinUrl: data.linkedinUrl || undefined,
            role: 'participant',
            createdAt: new Date().toISOString(),
          };
          await db.saveUser({ ...leaderUser, passwordHash: bcrypt.hashSync(defaultPassword, 10) });
        }

        const autoApprove = process.env.AUTO_APPROVE_REGISTRATIONS === 'true';
        const initialStatus: TeamStatus = autoApprove ? 'approved' : 'pending_approval';

        const newTeam: Team = {
          id: teamId,
          registrationId,
          name: data.teamName.trim(),
          teamCode,
          teamSize: 1 + formattedMembers.length,
          leaderId: leaderUser.id,
          leaderName: data.leaderName.trim(),
          leaderEmail: normalizedLeaderEmail,
          phone: data.phone.trim(),
          department: data.department,
          year: data.year,
          college: data.college,
          githubUrl: data.githubUrl || undefined,
          linkedinUrl: data.linkedinUrl || undefined,
          challengeId: resolvedChallengeId,
          challengeCode,
          challengeTitle,
          members: formattedMembers,
          pptFile: pptFileMetadata,
          status: initialStatus,
          auditLog: [
            {
              id: `aud-${Date.now()}-init`,
              timestamp: new Date().toISOString(),
              changedBy: 'system',
              previousStatus: 'pending',
              newStatus: initialStatus,
              reason: 'Team registered directly. Entered organizer review queue.',
            },
          ],
          emailVerified: true,
          verifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Persist team directly in database
        await db.createTeam(newTeam);

        const token = signToken({
          id: leaderUser.id,
          email: leaderUser.email,
          fullName: leaderUser.fullName,
          role: leaderUser.role,
        });

        return res.status(201).json({
          success: true,
          message: 'Registration submitted successfully! Your Zetathon registration has been recorded.',
          registrationId,
          team: newTeam,
          token,
          user: leaderUser,
        });
      }));
    } catch (err: any) {
      console.error('Team registration error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error processing registration.' });
    }
  },

  /**
   * Deprecated OTP endpoints (retained for backward compatibility, no emails sent)
   */
  async verifyOtpAndComplete(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      message: 'Email verification is no longer required. Registration is direct.',
    });
  },

  async resendOtp(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      message: 'Email verification is no longer required.',
    });
  },

  async getDevOtp(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      message: 'Email verification is no longer required.',
    });
  },

  async getMyTeam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const team = await db.getTeamByUserIdOrEmail(req.user.id) || await db.getTeamByUserIdOrEmail(req.user.email);
      if (!team) {
        return res.status(404).json({ success: false, error: 'No team found for current user.' });
      }

      return res.json({ success: true, team });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve team details.' });
    }
  },

  async getTeamById(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const team = await db.getTeamById(id) || await db.getTeamByRegistrationId(id);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }
      return res.json({ success: true, team });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to get team.' });
    }
  },

  /**
   * Secure PPT Download & Streaming.
   * Access restricted to authenticated organizers (admin) or the team's verified leader.
   */
  async getPresentationFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required to access presentation files.' });
      }

      const id = String(req.params.id);
      const team = await db.getTeamById(id) || await db.getTeamByRegistrationId(id);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      // Check authorization
      const isAdmin = req.user.role === 'admin';
      const isLeader =
        req.user.id === team.leaderId ||
        req.user.email.toLowerCase() === team.leaderEmail.toLowerCase();

      if (!isAdmin && !isLeader) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You are not authorized to download this project presentation.',
        });
      }

      if (!team.pptFile || !team.pptFile.fileId) {
        return res.status(404).json({
          success: false,
          error: 'No project presentation has been uploaded for this team.',
        });
      }

      const filePath = getUploadedFilePath(team.pptFile.fileId);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Presentation file could not be located in secure storage.',
        });
      }

      const stat = fs.statSync(filePath);
      res.setHeader('Content-Type', team.pptFile.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(team.pptFile.originalName)}"`
      );

      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } catch (err: any) {
      console.error('Presentation download error:', err);
      return res.status(500).json({ success: false, error: 'Failed to stream presentation file.' });
    }
  },
};
