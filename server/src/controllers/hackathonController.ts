import { Request, Response } from 'express';
import { db } from '../services/db.js';

export const hackathonController = {
  async getConfig(req: Request, res: Response) {
    try {
      const config = await db.getConfig();
      return res.json({ success: true, data: config });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch configuration.' });
    }
  },

  async getChallenges(req: Request, res: Response) {
    try {
      const challenges = await db.getChallenges();
      return res.json({ success: true, data: challenges });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch challenges.' });
    }
  },

  async getChallengeById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const challenge = await db.getChallengeById(id);
      if (!challenge) {
        return res.status(404).json({ success: false, error: 'Challenge not found.' });
      }
      return res.json({ success: true, data: challenge });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch challenge details.' });
    }
  },

  async getTimeline(req: Request, res: Response) {
    try {
      const timeline = await db.getTimeline();
      return res.json({ success: true, data: timeline });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch timeline.' });
    }
  },

  async getPrizes(req: Request, res: Response) {
    try {
      const prizes = await db.getPrizes();
      return res.json({ success: true, data: prizes });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch prizes.' });
    }
  },

  async getFaqs(req: Request, res: Response) {
    try {
      const faqs = await db.getFaqs();
      return res.json({ success: true, data: faqs });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch FAQs.' });
    }
  },

  async getAnnouncements(req: Request, res: Response) {
    try {
      const announcements = await db.getAnnouncements();
      return res.json({ success: true, data: announcements });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch announcements.' });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const config = await db.getConfig();
      const teams = await db.getTeams();
      const submissions = await db.getSubmissions();

      let totalParticipants = 0;
      teams.forEach(t => {
        totalParticipants += 1 + (t.members?.length || 0);
      });

      return res.json({
        success: true,
        data: {
          hours: config.stats.hours,
          teamsCount: teams.length,
          teamsDisplay: `${teams.length}+`,
          challengesCount: config.challenges.length,
          prizePool: config.stats.prizePool,
          participantsCount: Math.max(totalParticipants, 120),
          submissionsCount: submissions.length,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to calculate stats.' });
    }
  },
};
