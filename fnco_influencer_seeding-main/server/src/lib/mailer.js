import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('[Mailer] SMTP not configured, using mock transport');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, from }) {
  const transport = getTransporter();

  if (!transport) {
    console.log('[Mailer] MOCK send:', { to, subject });
    return { messageId: `mock-${Date.now()}`, mock: true };
  }

  const info = await transport.sendMail({
    from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  console.log('[Mailer] Email sent:', info.messageId);
  return info;
}
