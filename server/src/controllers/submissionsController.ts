import { Response } from 'express';
import { z } from 'zod';
import { db } from '../services/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Submission } from '../types/index.js';

const submissionSchema = z.object({
  teamId: z.string().optional(),
  projectTitle: z.string().min(3, 'Project title must be at least 3 characters'),
  projectDescription: z.string().min(20, 'Please provide a clear description (at least 20 chars)'),
  githubUrl: z.string().url('A valid public GitHub repository URL is required'),
  demoUrl: z.string().url('Invalid demo URL').optional().or(z.literal('')),
  videoUrl: z.string().url('Invalid video/pitch URL').optional().or(z.literal('')),
  remarks: z.string().optional(),
});

export const submissionsController = {
  async submitProject(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      // Check deadline
      const config = await db.getConfig();
      const deadline = new Date(config.dates.submissionDeadline).getTime();
      const now = Date.now();

      if (now > deadline) {
        return res.status(403).json({
          success: false,
          error: 'The hackathon submission deadline has passed. Submissions are now closed.',
        });
      }

      const parsed = submissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const team = await db.getTeamByUserIdOrEmail(req.user.id) || await db.getTeamByUserIdOrEmail(req.user.email);
      if (!team) {
        return res.status(400).json({
          success: false,
          error: 'You are not associated with any registered team.',
        });
      }

      if (team.status !== 'approved' && team.status !== 'shortlisted') {
        return res.status(403).json({
          success: false,
          error: `Your team registration status is '${team.status}'. Only approved or shortlisted teams are authorized to submit project deliverables.`,
        });
      }

      const existingSubmission = await db.getSubmissionByTeamId(team.id);

      const submissionData: Submission = {
        id: existingSubmission ? existingSubmission.id : `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        teamId: team.id,
        teamName: team.name,
        challengeCode: team.challengeCode || 'GENERAL',
        projectTitle: parsed.data.projectTitle,
        projectDescription: parsed.data.projectDescription,
        githubUrl: parsed.data.githubUrl,
        demoUrl: parsed.data.demoUrl || undefined,
        videoUrl: parsed.data.videoUrl || undefined,
        remarks: parsed.data.remarks || undefined,
        status: 'submitted',
        score: existingSubmission?.score,
        feedback: existingSubmission?.feedback,
        submittedAt: existingSubmission ? existingSubmission.submittedAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.saveSubmission(submissionData);

      return res.status(200).json({
        success: true,
        message: existingSubmission ? 'Project submission updated successfully!' : 'Project submitted successfully!',
        submission: submissionData,
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process project submission.' });
    }
  },

  async getMySubmission(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const team = await db.getTeamByUserIdOrEmail(req.user.id) || await db.getTeamByUserIdOrEmail(req.user.email);
      if (!team) {
        return res.json({ success: true, submission: null });
      }

      const submission = await db.getSubmissionByTeamId(team.id);
      return res.json({ success: true, submission: submission || null });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve submission.' });
    }
  },

  async updateSubmission(req: AuthRequest, res: Response) {
    // Re-use submitProject logic with validation and deadline checks
    return submissionsController.submitProject(req, res);
  },
};
