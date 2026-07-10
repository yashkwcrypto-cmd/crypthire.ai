import nodemailer from 'nodemailer';
import { logger } from '@/app/server/logger';

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  connectionTimeout: 10000, // 10 seconds max wait
  greetingTimeout: 10000,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

/**
 * Creates a nodemailer transporter
 */
function createTransporter() {
  return nodemailer.createTransport(SMTP_CONFIG);
}

/**
 * Sends an email
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@crypthire.ai',
      to,
      subject,
      html: html || text,
      text,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', error);
    return false;
  }
}

/**
 * Sends a candidate submission confirmation email
 */
export async function sendCandidateConfirmation(
  email: string,
  candidateName: string
): Promise<boolean> {
  const subject = 'Application Received - CryptHire AI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Application Received</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for submitting your application to CryptHire AI. We have received your resume and our AI system will analyze it shortly.</p>
      <p>You will be notified once our team has reviewed your application.</p>
      <p>Best regards,<br>The CryptHire AI Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends an interview invitation email
 */
export async function sendInterviewInvitation(
  email: string,
  candidateName: string,
  interviewDate: string
): Promise<boolean> {
  const subject = 'Interview Invitation - CryptHire AI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Interview Invitation</h2>
      <p>Dear ${candidateName},</p>
      <p>We are pleased to invite you for an interview with our team.</p>
      <p><strong>Date:</strong> ${interviewDate}</p>
      <p>Please confirm your availability by replying to this email.</p>
      <p>Best regards,<br>The CryptHire AI Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a rejection email
 */
export async function sendRejectionEmail(
  email: string,
  candidateName: string
): Promise<boolean> {
  const subject = 'Application Update - CryptHire AI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Application Update</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for your interest in CryptHire AI. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
      <p>We appreciate the time you took to apply and wish you the best in your job search.</p>
      <p>Best regards,<br>The CryptHire AI Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends the daily cron PDF report to HR
 */
export async function sendDailyReportEmail(
  hrEmail: string,
  pdfBuffer: Buffer,
  dateString: string,
  excelBuffer?: Buffer
): Promise<boolean> {
  const subject = `Daily Candidates Report - ${dateString}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Daily Candidate Report</h2>
      <p>Hello,</p>
      <p>Please find attached the daily AI analysis report of all candidates submitted on <strong>${dateString}</strong>.</p>
      <p>Best regards,<br>The CryptHire AI Team</p>
    </div>
  `;

  const attachments: any[] = [
    {
      filename: `candidates-report-${dateString.replace(/\//g, '-')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ];

  if (excelBuffer) {
    attachments.push({
      filename: `candidates-data-${dateString.replace(/\//g, '-')}.xlsx`,
      content: excelBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  return sendEmail({
    to: hrEmail,
    subject,
    html,
    attachments,
  });
}
