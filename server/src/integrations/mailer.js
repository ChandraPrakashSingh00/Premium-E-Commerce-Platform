import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (env.smtpEnabled) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      pool: true,
      maxConnections: 5,
    });
  } else {
    // No SMTP configured: render the message to JSON and log it (development/test only).
    transporter = nodemailer.createTransport({ jsonTransport: true });
    if (env.isProd) logger.warn('SMTP is not configured – emails will NOT be delivered.');
  }
  return transporter;
};

export const mailer = {
  isEnabled: () => env.smtpEnabled,

  /** @param {{to:string, subject:string, html:string, text?:string}} message */
  async send({ to, subject, html, text }) {
    const info = await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
    if (!env.smtpEnabled) logger.info({ to, subject }, 'Email rendered (SMTP not configured, not delivered)');
    return info;
  },
};
