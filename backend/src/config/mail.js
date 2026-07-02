import nodemailer from 'nodemailer';

// Verify required environment variables for Gmail SMTP
const requiredVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`[mail] Missing required SMTP env vars: ${missing.join(", ")}`);
  // Exit process to avoid silent failure in production
  process.exit(1);
}

// Build transporter using Gmail SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[mail] SMTP connection error:', error);
  } else {
    console.log('[mail] SMTP server is ready to take messages');
  }
});

export default transporter;
