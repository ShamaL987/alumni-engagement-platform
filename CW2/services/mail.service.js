const { Resend } = require('resend');

function getMailMode() {
  return String(process.env.MAIL_MODE || 'console').toLowerCase();
}

function getBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:5000';
}

function getFromAddress() {
  return process.env.MAIL_FROM || 'Alumni Influencers <onboarding@resend.dev>';
}

function createResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function logConsoleEmail({ to, subject, text, html }) {
  console.log('\n[console-mail]');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log(text || html);
  console.log('[/console-mail]\n');
}

async function verifyTransport() {
  if (getMailMode() !== 'resend') {
    return true;
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing');
  }

  return true;
}

async function sendEmail({ to, subject, text, html }) {
  if (getMailMode() !== 'resend') {
    logConsoleEmail({ to, subject, text, html });
    return { console: true };
  }

  const resend = createResendClient();

  if (!resend) {
    throw new Error('RESEND_API_KEY is missing');
  }

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    text,
    html
  });

  if (error) {
    throw new Error(error.message || 'Failed to send email through Resend');
  }

  return data;
}

async function sendVerificationEmail(user, token) {
  const link = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: user.email,
    subject: 'Verify your Alumni Influencers account',
    text: `Verify your email using this link: ${link}\n\nToken: ${token}`,
    html: `
      <p>Please verify your email:</p>
      <p><a href="${link}">Verify email</a></p>
      <p>Token: <strong>${token}</strong></p>
    `
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: user.email,
    subject: 'Reset your Alumni Influencers password',
    text: `Reset your password using this link: ${link}\n\nToken: ${token}`,
    html: `
      <p>Reset your password:</p>
      <p><a href="${link}">Reset password</a></p>
      <p>Token: <strong>${token}</strong></p>
    `
  });
}

async function sendBidResultEmail(user, profile, cycle, status, amount) {
  const name = profile?.fullName || user.email;

  if (status === 'won') {
    return sendEmail({
      to: user.email,
      subject: 'Your alumni feature bid won',
      text: `Congratulations ${name}. Your bid of ${amount} won for ${cycle.featuredDate}.`,
      html: `
        <p>Congratulations ${name}.</p>
        <p>Your bid of <strong>${amount}</strong> won for <strong>${cycle.featuredDate}</strong>.</p>
      `
    });
  }

  return sendEmail({
    to: user.email,
    subject: 'Your alumni feature bid was not selected',
    text: `Your bid for ${cycle.featuredDate} was not selected. You can bid again in the next cycle.`,
    html: `
      <p>Your bid for <strong>${cycle.featuredDate}</strong> was not selected.</p>
      <p>You can bid again in the next cycle.</p>
    `
  });
}

module.exports = {
  verifyTransport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBidResultEmail
};