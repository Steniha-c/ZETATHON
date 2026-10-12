import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { hackathonController } from '../controllers/hackathonController.js';
import { teamsController } from '../controllers/teamsController.js';
import { submissionsController } from '../controllers/submissionsController.js';
import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { uploadPPTMiddleware } from '../services/fileUploadService.js';

export const apiRouter = Router();

// ==========================================
// PUBLIC & HACKATHON CONTENT ROUTES
// ==========================================
apiRouter.get('/config', hackathonController.getConfig);
apiRouter.get('/stats', hackathonController.getStats);
apiRouter.get('/challenges', hackathonController.getChallenges);
apiRouter.get('/challenges/:id', hackathonController.getChallengeById);
apiRouter.get('/timeline', hackathonController.getTimeline);
apiRouter.get('/prizes', hackathonController.getPrizes);
apiRouter.get('/faqs', hackathonController.getFaqs);
apiRouter.get('/announcements', hackathonController.getAnnouncements);

// ==========================================
// AUTHENTICATION
// ==========================================
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/login', authController.login);
apiRouter.get('/auth/me', requireAuth, authController.me);
apiRouter.post('/auth/forgot-password', authController.forgotPassword);
apiRouter.post('/auth/logout', authController.logout);

// ==========================================
// TEAMS & REGISTRATION (Handles JSON and multipart/form-data with PPT)
// ==========================================
apiRouter.post('/teams', uploadPPTMiddleware.single('pptFile'), teamsController.registerTeam);
apiRouter.post('/teams/verify-otp', teamsController.verifyOtpAndComplete);
apiRouter.post('/teams/resend-otp', teamsController.resendOtp);
apiRouter.get('/teams/dev-otp', teamsController.getDevOtp);
apiRouter.get('/teams/my-team', requireAuth, teamsController.getMyTeam);
apiRouter.get('/teams/:id', teamsController.getTeamById);
apiRouter.get('/teams/:id/ppt', requireAuth, teamsController.getPresentationFile);

// ==========================================
// SUBMISSIONS
// ==========================================
apiRouter.post('/submissions', requireAuth, submissionsController.submitProject);
apiRouter.put('/submissions/:id', requireAuth, submissionsController.updateSubmission);
apiRouter.get('/submissions/my-submission', requireAuth, submissionsController.getMySubmission);

// ==========================================
// ADMIN DASHBOARD & CONTENT MANAGEMENT (Protected)
// ==========================================
apiRouter.get('/admin/overview', requireAdmin, adminController.getOverview);
apiRouter.get('/admin/teams', requireAdmin, adminController.getTeams);
apiRouter.put('/admin/teams/:id/status', requireAdmin, adminController.updateTeamStatus);
apiRouter.delete('/admin/teams/:id', requireAdmin, adminController.deleteTeam);
apiRouter.get('/admin/teams/:id/ppt', requireAdmin, teamsController.getPresentationFile);
apiRouter.post('/admin/teams/:id/resend-email', requireAdmin, adminController.resendNotificationEmail);
apiRouter.get('/admin/participants', requireAdmin, adminController.getParticipants);
apiRouter.get('/admin/submissions', requireAdmin, adminController.getSubmissions);
apiRouter.put('/admin/submissions/:teamId/grade', requireAdmin, adminController.gradeSubmission);

// Admin Announcements
apiRouter.post('/admin/announcements', requireAdmin, adminController.createAnnouncement);
apiRouter.put('/admin/announcements/:id', requireAdmin, adminController.updateAnnouncement);
apiRouter.delete('/admin/announcements/:id', requireAdmin, adminController.deleteAnnouncement);

// Admin Content Management
apiRouter.put('/admin/config', requireAdmin, adminController.updateConfig);
apiRouter.post('/admin/challenges', requireAdmin, adminController.saveChallenge);
apiRouter.delete('/admin/challenges/:id', requireAdmin, adminController.deleteChallenge);
apiRouter.post('/admin/timeline', requireAdmin, adminController.saveTimelineItem);
apiRouter.delete('/admin/timeline/:id', requireAdmin, adminController.deleteTimelineItem);
apiRouter.post('/admin/faqs', requireAdmin, adminController.saveFaq);
apiRouter.delete('/admin/faqs/:id', requireAdmin, adminController.deleteFaq);

// Admin Data Export
apiRouter.get('/admin/export', requireAdmin, adminController.exportData);
