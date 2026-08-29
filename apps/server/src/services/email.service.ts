import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email stub] To: ${to} | ${subject}`);
    return;
  }
  await transport.sendMail({
    from: env.EMAIL_FROM || 'Nexus Chat <noreply@nexus.chat>',
    to,
    subject,
    html,
  });
}

export function verificationEmailHtml(link: string) {
  return `<p>Verify your Nexus Chat account:</p><p><a href="${link}">${link}</a></p>`;
}

export function resetPasswordEmailHtml(link: string) {
  return `<p>Reset your password:</p><p><a href="${link}">${link}</a></p>`;
}
