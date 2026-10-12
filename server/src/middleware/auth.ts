import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { UserRole } from '../types/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const FALLBACK_SECRET = 'zetathon-production-secret-key-2026';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  console.warn('⚠️ SECURITY WARNING: Using fallback JWT_SECRET in production. Set a unique JWT_SECRET in environment variables.');
}

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Always fetch authentic user record from database to prevent trusting forged roles or deleted users
    const dbUser = await db.getUserByEmail(decoded.email);
    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        role: dbUser.role, // Authoritative role from database
      };
    } else {
      // User was deleted or does not exist; invalidate session
      req.user = undefined;
    }
    next();
  } catch (err) {
    // Expired or tampered token: do not set req.user
    req.user = undefined;
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to proceed.',
    });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in as an administrator.',
    });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
    });
  }
  next();
}
