import crypto from 'node:crypto';
import { EmailVerificationRecord } from '../types/index.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_RESENDS_PER_SESSION = 5;

const OTP_SALT = process.env.OTP_SALT || process.env.JWT_SECRET || 'zetathon-secure-otp-hash-salt-2026';

export interface OtpGenerationResult {
  email: string;
  expiresAt: number;
  cooldownSeconds: number;
  devOtpCode?: string; // ONLY available in development/test environment
}

export interface OtpVerificationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  payload?: any;
}

class OtpService {
  // In-memory store of active pending verification records keyed by normalized email
  private store: Map<string, EmailVerificationRecord> = new Map();
  // Safe dev-only map for automated test suite retrieval, completely stripped in production
  private devTestOtpVault: Map<string, string> = new Map();

  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   */
  public generateSecureOtp(): string {
    const min = 100000;
    const max = 1000000;
    return crypto.randomInt(min, max).toString();
  }

  /**
   * Computes a cryptographic HMAC-SHA256 hash of the OTP code.
   */
  public hashOtp(code: string): string {
    return crypto.createHmac('sha256', OTP_SALT).update(code.trim()).digest('hex');
  }

  /**
   * Constant-time comparison between entered code and stored hash.
   */
  private verifyHash(enteredCode: string, storedHash: string): boolean {
    const computedHash = this.hashOtp(enteredCode);
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (computedBuf.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  }

  /**
   * Initializes or updates a pending registration with a fresh 6-digit OTP.
   * Invalidates any previously issued OTP for this email.
   */
  public createVerification(email: string, registrationPayload: any): { record: EmailVerificationRecord; rawOtp: string; cooldownSeconds: number } {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.store.get(normalizedEmail);

    const rawOtp = this.generateSecureOtp();
    const otpHash = this.hashOtp(rawOtp);
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_MS;

    const resendCount = existing ? existing.resendCount + 1 : 0;

    const record: EmailVerificationRecord = {
      id: `verif-${now}-${crypto.randomBytes(3).toString('hex')}`,
      email: normalizedEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      resendCount,
      lastSentAt: now,
      registrationPayload,
      createdAt: new Date(now).toISOString(),
    };

    // Store the updated record, automatically invalidating any previous OTP
    this.store.set(normalizedEmail, record);

    if (process.env.NODE_ENV !== 'production') {
      this.devTestOtpVault.set(normalizedEmail, rawOtp);
    }

    return {
      record,
      rawOtp,
      cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    };
  }

  /**
   * Checks whether an OTP can be resent (cooldown and limit enforcement).
   */
  public checkResendEligibility(email: string): { eligible: boolean; waitSeconds?: number; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.store.get(normalizedEmail);

    if (!record) {
      return { eligible: false, error: 'No active pending registration session found. Please fill out the registration form.' };
    }

    const elapsed = Date.now() - record.lastSentAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { eligible: false, waitSeconds, error: `Please wait ${waitSeconds}s before requesting another verification code.` };
    }

    if (record.resendCount >= MAX_RESENDS_PER_SESSION) {
      return { eligible: false, error: 'Maximum resend limit reached for this session. Please wait for the current code to expire or re-register.' };
    }

    return { eligible: true };
  }

  /**
   * Verifies the submitted OTP against stored hash with expiry, attempt counting, and brute-force protection.
   */
  public verifyOtp(email: string, code: string): OtpVerificationResult {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.store.get(normalizedEmail);

    if (!record) {
      return {
        valid: false,
        statusCode: 400,
        error: 'No active verification session found. Your session may have expired. Please submit the registration form again.',
      };
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      this.store.delete(normalizedEmail);
      this.devTestOtpVault.delete(normalizedEmail);
      return {
        valid: false,
        statusCode: 400,
        error: 'Verification code has expired. Please request a new code.',
      };
    }

    // Check brute-force attempt limits
    if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      this.store.delete(normalizedEmail);
      this.devTestOtpVault.delete(normalizedEmail);
      return {
        valid: false,
        statusCode: 429,
        error: 'Too many incorrect attempts. This verification code has been invalidated for security. Please request a new code.',
      };
    }

    // Increment attempt counter
    record.attempts += 1;

    // Verify hash constant-time
    const isMatch = this.verifyHash(code, record.otpHash);
    if (!isMatch) {
      const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;
      return {
        valid: false,
        statusCode: 400,
        error: remaining > 0
          ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
          : 'Incorrect code. Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Verification succeeded
    record.verifiedAt = Date.now();
    const payload = record.registrationPayload;

    // Remove from active pending store
    this.store.delete(normalizedEmail);
    this.devTestOtpVault.delete(normalizedEmail);

    return {
      valid: true,
      payload,
    };
  }

  /**
   * Retrieve active pending verification metadata (never exposes OTP or hash).
   */
  public getPendingSession(email: string): { exists: boolean; expiresAt?: number; remainingSeconds?: number; registrationPayload?: any } {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.store.get(normalizedEmail);
    if (!record) return { exists: false };

    const remaining = Math.max(0, Math.floor((record.expiresAt - Date.now()) / 1000));
    return {
      exists: true,
      expiresAt: record.expiresAt,
      remainingSeconds: remaining,
      registrationPayload: record.registrationPayload,
    };
  }

  /**
   * Checks whether a team name is currently locked in an active pending OTP session.
   */
  public isTeamNamePending(teamName: string): boolean {
    const cleanName = teamName.trim().toLowerCase();
    const now = Date.now();
    for (const record of this.store.values()) {
      if (now <= record.expiresAt) {
        const payloadName = record.registrationPayload?.teamName;
        if (payloadName && payloadName.trim().toLowerCase() === cleanName) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Development & automated testing helper. Completely inactive in production.
   */
  public getDevTestOtp(email: string): string | null {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return this.devTestOtpVault.get(email.trim().toLowerCase()) || null;
  }
}

export const otpService = new OtpService();
