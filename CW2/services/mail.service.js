const nodemailer = require('nodemailer');

function buildTransporter() {
  if ((process.env.MAIL_MODE || 'console') === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      } : undefined
    });
  }

  return null;
}

const transporter = buildTransporter();

async function verifyTransport() {
  if (!transporter) return true;
  return transporter.verify();
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.log('\n[console-mail]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log(text || html);
    console.log('[/console-mail]\n');
    return { console: true };
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@alumni.local',
    to,
    subject,
    text,
    html
  });
}

async function sendVerificationEmail(user, token) {
  const link = `${process.env.APP_BASE_URL || 'http://localhost:5000'}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Alumni Influencers account',
    text: `Verify your email using this link: ${link}\n\nToken: ${token}`,
    html: `<p>Please verify your email:</p><p><a href="${link}">Verify email</a></p><p>Token: <strong>${token}</strong></p>`
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${process.env.APP_BASE_URL || 'http://localhost:5000'}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your Alumni Influencers password',
    text: `Reset your password using this link: ${link}\n\nToken: ${token}`,
    html: `<p>Reset your password:</p><p><a href="${link}">Reset password</a></p><p>Token: <strong>${token}</strong></p>`
  });
}

async function sendBidResultEmail(user, profile, cycle, status, amount) {
  return sendEmail({
    to: user.email,
    subject: status === 'won' ? 'Your alumni feature bid won' : 'Your alumni feature bid was not selected',
    text: status === 'won'
      ? `Congratulations ${profile?.fullName || user.email}. Your bid of ${amount} won for ${cycle.featuredDate}.`
      : `Your bid for ${cycle.featuredDate} was not selected. You can bid again in the next cycle.`
  });
}

module.exports = {
  verifyTransport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBidResultEmail
};
