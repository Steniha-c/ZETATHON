import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { PPTFileMetadata } from '../types/index.js';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'resend' | 'smtp' | 'dev_mock';
}

class EmailService {
  private resendClient: Resend | null = null;
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private providerType: 'resend' | 'smtp' | 'dev_mock' = 'dev_mock';

  constructor() {
    this.init();
  }

  public init() {
    // If process.env.RESEND_API_KEY isn't loaded yet due to ES module import hoisting, load from env paths
    if (!process.env.RESEND_API_KEY) {
      const candidateEnvFiles = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'server', '.env'),
        path.resolve(process.cwd(), 'src', '.env'),
        path.resolve(process.cwd(), '..', '.env'),
      ];
      for (const envFile of candidateEnvFiles) {
        if (fs.existsSync(envFile)) {
          dotenv.config({ path: envFile });
        }
      }
      dotenv.config();
    }

    const resendKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (resendKey && resendKey.trim().length > 5) {
      try {
        this.resendClient = new Resend(resendKey.trim());
        this.isConfigured = true;
        this.providerType = 'resend';
        console.log('📧 EmailService: Initialized via official Resend SDK');
      } catch (err: any) {
        console.warn('⚠️ EmailService: Failed to initialize official Resend SDK:', err.message);
        this.isConfigured = false;
      }
    } else if (smtpHost && smtpUser && smtpPass) {
      try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.isConfigured = true;
        this.providerType = 'smtp';
        console.log(`📧 EmailService: Initialized via SMTP Provider (${smtpHost}:${port})`);
      } catch (err: any) {
        console.warn('⚠️ EmailService: SMTP Transport initialization failed:', err.message);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      this.providerType = 'dev_mock';
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ EmailService: No production email provider configured (RESEND_API_KEY or SMTP credentials missing).');
      } else {
        console.log('🧪 EmailService: Running in local Development/Test Mock mode (outbound emails simulated).');
      }
    }
  }

  public isEmailConfigured(): boolean {
    return this.isConfigured || process.env.NODE_ENV !== 'production';
  }

  public getProviderType(): string {
    return this.providerType;
  }

  public async sendEmail(opts: EmailSendOptions): Promise<EmailSendResult> {
    // Email notifications (verification, confirmation, and status updates) are disabled.
    return {
      success: true,
      provider: 'dev_mock',
      messageId: 'disabled_no_op',
    };
  }

  /**
   * EMAIL 1: Registration Confirmation Email
   * Sent to the team leader after registration & PPT storage have succeeded.
   */
  public async sendRegistrationConfirmationEmail(
    toEmail: string,
    leaderName: string,
    teamName: string,
    registrationId: string,
    pptMetadata?: PPTFileMetadata
  ): Promise<EmailSendResult> {
    const subject = `ZETATHON 2026: Registration Confirmed [ID: ${registrationId}] - Team ${teamName}`;
    const pptStatusLine = pptMetadata
      ? `✅ <strong>Project Presentation Received:</strong> ${pptMetadata.originalName} (${(pptMetadata.sizeBytes / (1024 * 1024)).toFixed(2)} MB) - Securely stored & forwarded to jury review`
      : `⚠️ <strong>Project Presentation:</strong> No presentation file was attached during registration`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 24px; margin: 0; }
            .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; font-family: monospace; }
            .subtitle { font-size: 11px; letter-spacing: 2px; color: #00f2fe; text-transform: uppercase; font-weight: bold; margin-top: 4px; }
            .id-box { background: rgba(0, 242, 254, 0.08); border: 2px dashed #00f2fe; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
            .id-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-family: monospace; }
            .id-value { font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #38bdf8; font-family: monospace; margin: 6px 0 0 0; }
            .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            .meta-table td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .meta-label { color: #94a3b8; font-family: monospace; text-transform: uppercase; width: 38%; }
            .meta-val { color: #f8fafc; font-weight: 600; }
            .info-box { background: rgba(0, 242, 254, 0.05); border-radius: 10px; padding: 16px; margin: 18px 0; border: 1px solid rgba(0, 242, 254, 0.2); font-size: 13px; line-height: 1.6; }
            .step-list { margin: 14px 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.7; }
            .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 12px; }
            .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="title">ZETATHON 2026</div>
              <div class="subtitle">REGISTRATION & SUBMISSION RECEIPT</div>
            </div>
            <p class="text">Dear <strong>${leaderName}</strong>,</p>
            <p class="text">Your team registration has been recorded successfully. Please find your official confirmation details below:</p>
            
            <div class="id-box">
              <div class="id-label">OFFICIAL REGISTRATION IDENTIFIER</div>
              <div class="id-value">${registrationId}</div>
            </div>

            <table class="meta-table">
              <tr>
                <td class="meta-label">Team Name:</td>
                <td class="meta-val">${teamName}</td>
              </tr>
              <tr>
                <td class="meta-label">Team Leader:</td>
                <td class="meta-val">${leaderName} (${toEmail})</td>
              </tr>
              <tr>
                <td class="meta-label">Registration ID:</td>
                <td class="meta-val"><code style="color: #38bdf8;">${registrationId}</code></td>
              </tr>
              <tr>
                <td class="meta-label">PPT Receipt:</td>
                <td class="meta-val">${pptMetadata ? pptMetadata.originalName : 'Not uploaded'}</td>
              </tr>
            </table>

            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>Project Presentation Receipt:</strong></p>
              <p style="margin: 0; color: #38bdf8;">${pptStatusLine}</p>
            </div>

            <p class="text"><strong>What Happens Next:</strong></p>
            <ol class="step-list">
              <li><strong>Organizer & Jury Evaluation:</strong> The ZETA Technical Selection Committee is evaluating your submitted PPT presentation and concept abstract.</li>
              <li><strong>Shortlisting Announcement:</strong> Shortlisted teams will receive an official congratulations email containing comprehensive Round 2 schedule and reporting instructions.</li>
              <li><strong>Event Verification:</strong> Please save this Registration ID (<code>${registrationId}</code>) for all communications and check-in desk verification.</li>
            </ol>

            <div class="footer">
              ZETATHON 2026 Organizing Committee • ZETA E-Cell DCE<br>
              This is an automated confirmation sent via official Resend delivery.
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `ZETATHON 2026: Team Registration Confirmed\n\nDear ${leaderName},\n\nYour team "${teamName}" is officially registered.\nRegistration ID: ${registrationId}\nLeader: ${leaderName}\nEmail: ${toEmail}\nPPT Status: ${pptMetadata ? `Received (${pptMetadata.originalName})` : 'Not uploaded'}\n\nOur organizing jury is reviewing your presentation deck. You will be notified when shortlisting is announced.`;

    return this.sendEmail({ to: toEmail, subject, html, text });
  }

  /**
   * EMAIL 2: Shortlisting Confirmation Email with Round 2 Details
   * Sent when an authorized admin marks a team as Shortlisted.
   */
  public async sendShortlistConfirmationEmail(
    toEmail: string,
    leaderName: string,
    teamName: string,
    registrationId: string
  ): Promise<EmailSendResult> {
    const subject = `🎉 Congratulations! Team ${teamName} Shortlisted for Round 2 [ID: ${registrationId}] - ZETATHON 2026`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 24px; margin: 0; }
            .card { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(244, 114, 182, 0.4); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; font-family: monospace; }
            .badge { display: inline-block; background: rgba(244, 114, 182, 0.15); border: 1px solid #f472b6; color: #f472b6; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; font-family: monospace; margin-top: 8px; }
            .hero-box { background: linear-gradient(135deg, rgba(244,114,182,0.12), rgba(168,85,247,0.12)); border: 2px solid #ec4899; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0; }
            .congrats { font-size: 22px; font-weight: 900; color: #fbcfe8; margin: 0 0 8px 0; letter-spacing: 0.5px; }
            .id-val { font-size: 18px; font-weight: 900; color: #ffffff; font-family: monospace; }
            .round2-box { background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(244, 114, 182, 0.25); font-size: 13px; line-height: 1.6; }
            .round2-title { font-size: 15px; font-weight: 800; color: #f472b6; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; font-family: monospace; border-bottom: 1px solid rgba(244, 114, 182, 0.2); padding-bottom: 8px; }
            .detail-row { display: flex; margin-bottom: 8px; font-size: 13px; }
            .detail-label { width: 140px; color: #94a3b8; font-weight: 600; shrink-0; }
            .detail-value { color: #f8fafc; font-weight: 500; }
            .checklist { margin: 12px 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.7; }
            .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 12px; }
            .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="title">ZETATHON 2026</div>
              <div class="badge">OFFICIALLY SHORTLISTED FOR ROUND 2</div>
            </div>
            <p class="text">Dear <strong>${leaderName}</strong> & members of team <strong>${teamName}</strong>,</p>
            
            <div class="hero-box">
              <div class="congrats">🚀 YOUR TEAM HAS BEEN SHORTLISTED!</div>
              <div class="id-val">Registration ID: ${registrationId}</div>
            </div>

            <p class="text">Congratulations! Following jury evaluation of your submitted project deck, the ZETATHON Selection Committee is pleased to inform you that team <strong>${teamName}</strong> has been selected to advance to the offline sprint round!</p>

            <div class="round2-box">
              <div class="round2-title">📋 Round 2: 8-Hour Innovation Sprint Details</div>
              
              <div class="detail-row">
                <span class="detail-label">Event Stage:</span>
                <span class="detail-value">Round 2 — Offline Prototyping & Grand Finale</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reporting Time:</span>
                <span class="detail-value"><strong style="color: #38bdf8;">08:30 AM Sharp</strong> (Desk check-in & kit distribution)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Sprint Kickoff:</span>
                <span class="detail-value"><strong>09:00 AM</strong> — Keynote, problem unlocks, & hacking starts</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">8 Hours Non-stop Hacking & Implementation</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span class="detail-value"><strong>ZETA Innovation Arena, DCE Campus (Academic Block 4)</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Evaluation:</span>
                <span class="detail-value">Hour 2 & 5 Mentor Sync &bull; 5-min Live Demo + 3-min Jury Q&A</span>
              </div>
            </div>

            <p class="text"><strong>Mandatory Round 2 Preparation:</strong></p>
            <ul class="checklist">
              <li><strong>Identification:</strong> Every member must present their valid College Student ID card at the entrance desk.</li>
              <li><strong>Hardware & Tools:</strong> Bring laptops, chargers, extension cords, and any required sensors or hardware kits.</li>
              <li><strong>Participant Dashboard:</strong> Log in to the ZETATHON participant dashboard using your team credentials to access your active team workspace and challenge tracks.</li>
              <li><strong>Code Integrity:</strong> All code must be developed during the 8-hour sprint window. Pre-written architectures and libraries must be documented in your README.</li>
            </ul>

            <p class="text">We look forward to witnessing your innovation come to life. Gear up and prepare your workspace!</p>

            <div class="footer">
              ZETATHON 2026 Organizing Committee • ZETA E-Cell DCE<br>
              Academic Block 4, DCE Campus &bull; Sent via official Resend integration
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `🎉 Congratulations! Team "${teamName}" is SHORTLISTED for Round 2 of ZETATHON 2026!\n\nRegistration ID: ${registrationId}\nTeam Leader: ${leaderName}\n\nROUND 2 SPRINT DETAILS:\n- Event: Round 2 Offline Innovation Sprint & Grand Finale\n- Reporting Time: 08:30 AM Sharp\n- Sprint Kickoff: 09:00 AM\n- Duration: 8 Hours Non-stop Development\n- Venue: ZETA Innovation Arena, DCE Campus (Academic Block 4)\n- Evaluation: Hour 2 & 5 Mentor Sync • 5-min Demo + 3-min Jury Q&A\n\nMandatory Checklist:\n- College IDs for all team members\n- Laptops, chargers, and development gear\n- Log into participant dashboard for track unlocks.\n\nSee you at the arena!`;

    return this.sendEmail({ to: toEmail, subject, html, text });
  }

  /**
   * EMAIL 3: Waitlist Notification Email
   */
  public async sendWaitlistEmail(
    toEmail: string,
    leaderName: string,
    teamName: string,
    registrationId: string,
    reason?: string
  ): Promise<EmailSendResult> {
    const subject = `ZETATHON 2026: Team ${teamName} Waitlist Update [ID: ${registrationId}]`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 24px; margin: 0; }
            .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; font-family: monospace; }
            .badge { display: inline-block; background: rgba(168, 85, 247, 0.15); border: 1px solid #c084fc; color: #c084fc; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; font-family: monospace; margin-top: 8px; }
            .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 12px; }
            .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="title">ZETATHON 2026</div>
              <div class="badge">WAITLIST STANDING</div>
            </div>
            <p class="text">Dear <strong>${leaderName}</strong>,</p>
            <p class="text">Thank you for submitting your project presentation for team <strong>${teamName}</strong> (ID: <code>${registrationId}</code>).</p>
            <p class="text">Your team is currently placed on the <strong>Official Waitlist</strong>. Due to high registration volumes and venue capacity, additional slots will be released sequentially as confirmations are completed.</p>
            ${reason ? `<p class="text"><em>Note from committee: ${reason}</em></p>` : ''}
            <p class="text">If a slot becomes available, our coordinators will reach out immediately.</p>
            <div class="footer">ZETATHON 2026 Organizing Committee • ZETA E-Cell DCE</div>
          </div>
        </body>
      </html>
    `;
    const text = `ZETATHON 2026: Team ${teamName} Waitlist Update (ID: ${registrationId})\n\nYour team is placed on the official waitlist. You will be contacted if additional spots open.`;
    return this.sendEmail({ to: toEmail, subject, html, text });
  }

  /**
   * EMAIL 4: Not Shortlisted Update Email
   */
  public async sendNotShortlistedEmail(
    toEmail: string,
    leaderName: string,
    teamName: string,
    registrationId: string,
    reason?: string
  ): Promise<EmailSendResult> {
    const subject = `ZETATHON 2026: Selection Update - Team ${teamName} [ID: ${registrationId}]`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 24px; margin: 0; }
            .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; font-family: monospace; }
            .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 12px; }
            .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="title">ZETATHON 2026</div>
            </div>
            <p class="text">Dear <strong>${leaderName}</strong>,</p>
            <p class="text">Thank you for submitting your project deck for team <strong>${teamName}</strong> (ID: <code>${registrationId}</code>).</p>
            <p class="text">Due to competitive evaluation and limited lab slots, your team was not shortlisted for this edition of ZETATHON. We truly appreciate the effort your team invested in your concept.</p>
            ${reason ? `<p class="text"><em>Evaluation note: ${reason}</em></p>` : ''}
            <p class="text">We encourage you to participate in upcoming ZETA workshops and future hackathons!</p>
            <div class="footer">ZETATHON 2026 Organizing Committee • ZETA E-Cell DCE</div>
          </div>
        </body>
      </html>
    `;
    const text = `ZETATHON 2026: Selection Update for Team ${teamName} (ID: ${registrationId})\n\nThank you for participating. Your team was not shortlisted for this edition. We look forward to seeing your innovation at future events!`;
    return this.sendEmail({ to: toEmail, subject, html, text });
  }

  /**
   * Existing OTP Email Verification
   */
  public async sendOtpEmail(toEmail: string, otpCode: string, teamName: string): Promise<EmailSendResult> {
    const subject = `ZETATHON 2026: Your Verification Code is ${otpCode}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 24px; margin: 0; }
            .card { max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; margin: 0; font-family: monospace; }
            .subtitle { font-size: 11px; letter-spacing: 1.5px; color: #00f2fe; text-transform: uppercase; font-weight: bold; margin-top: 4px; }
            .otp-box { background: rgba(0, 242, 254, 0.08); border: 2px dashed #00f2fe; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
            .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace; margin: 0; }
            .expiry { font-size: 12px; color: #94a3b8; margin-top: 10px; font-family: monospace; }
            .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 12px; }
            .warning { font-size: 11px; color: #f43f5e; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="title">ZETATHON 2026</div>
              <div class="subtitle">ZETA • 8-HOUR INTERNAL SPRINT</div>
            </div>
            <p class="text">Hello <strong>${teamName}</strong> Team Leader,</p>
            <p class="text">Thank you for registering for ZETATHON. To verify your email address and submit your registration for organizer review, enter this single-use code:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <div class="expiry">VALID FOR 5 MINUTES ONLY</div>
            </div>

            <p class="text">Once verified, your team registration enters <strong>Pending Review</strong>. You will be notified when your registration status is updated.</p>
            
            <div class="warning">
              Security notice: If you did not request this registration, please disregard this email. Never disclose this code to anyone.
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `ZETATHON 2026 Email Verification\n\nYour 6-digit code for team "${teamName}" is: ${otpCode}\nThis code is valid for 5 minutes only.\nDo not share this code with anyone.`;

    return this.sendEmail({ to: toEmail, subject, html, text });
  }
}

export const emailService = new EmailService();
