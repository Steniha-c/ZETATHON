import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../services/db.js';
import { signToken, AuthRequest } from '../middleware/auth.js';
import { UserProfile } from '../types/index.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  college: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authController = {
  async register(req: AuthRequest, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const { email, password, fullName, phone, department, year, college, githubUrl, linkedinUrl } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();

      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'A participant or user with this email already exists.',
        });
      }

      const passwordHash = bcrypt.hashSync(password, 10);

      // Force role to participant: never trust client-supplied roles
      const newUser: UserProfile = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        email: normalizedEmail,
        fullName,
        phone,
        department,
        year,
        college: college || 'ZETA Engineering College',
        githubUrl,
        linkedinUrl,
        role: 'participant',
        createdAt: new Date().toISOString(),
      };

      await db.saveUser({ ...newUser, passwordHash });

      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      });

      return res.status(201).json({
        success: true,
        message: 'Account successfully registered for ZETATHON!',
        token,
        user: newUser,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error during registration.' });
    }
  },

  async login(req: AuthRequest, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email or password format.',
        });
      }

      const { email, password } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();

      // Reject decommissioned legacy demo administrator account
      if (normalizedEmail === 'admin@zetathon.org') {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Legacy administrator account has been decommissioned.',
        });
      }

      const user = await db.getUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. User does not exist.',
        });
      }

      // Check password (bcrypt or legacy plain)
      let isMatch = false;
      if (user.passwordHash) {
        if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
          isMatch = bcrypt.compareSync(password, user.passwordHash);
        } else {
          isMatch = user.passwordHash === password;
        }
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Incorrect password.',
        });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });

      const { passwordHash, ...safeUser } = user;

      // Get team if available
      const team = await db.getTeamByUserIdOrEmail(user.id) || await db.getTeamByUserIdOrEmail(user.email);

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeUser,
        team: team || null,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error during login.' });
    }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }

      const user = await db.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const { passwordHash, ...safeUser } = user;
      const team = await db.getTeamByUserIdOrEmail(user.id) || await db.getTeamByUserIdOrEmail(user.email);
      const submission = team ? await db.getSubmissionByTeamId(team.id) : null;

      return res.json({
        success: true,
        user: safeUser,
        team: team || null,
        submission: submission || null,
      });
    } catch (err: any) {
      console.error('Me error:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
    }
  },

  async forgotPassword(req: AuthRequest, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    return res.json({
      success: true,
      message: `Password reset instructions sent to ${email}. Check your inbox or contact the ZETA organizing team desk.`,
    });
  },

  async logout(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  },
};
