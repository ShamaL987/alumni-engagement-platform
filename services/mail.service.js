const nodemailer = require('nodemailer');
const { TOKEN_EXPIRY_MINUTES } = require('./helper.service');

const isTrue = (value) => String(value).toLowerCase() === 'true';

const createTransporter = () => {
    const mailMode = process.env.MAIL_MODE || 'local';

    if (mailMode === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    return nodemailer.createTransport({
        host: process.env.LOCAL_SMTP_HOST || '127.0.0.1',
        port: Number(process.env.LOCAL_SMTP_PORT || 1025),
        secure: isTrue(process.env.LOCAL_SMTP_SECURE || 'false')
    });
};

const transporter = createTransporter();

const verifyTransport = async () => {
    return transporter.verify();
};

const sendEmail = async ({ to, subject, text, html }) => {
    return transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html
    });
};

const sendEmailSafely = async (payload, label = 'Email') => {
    try {
        await sendEmail(payload);
        return { success: true };
    } catch (error) {
        console.warn(`${label} failed:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

const buildVerificationLink = (plainToken) => {
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
    return `${appBaseUrl}/auth/verify-email?token=${encodeURIComponent(plainToken)}`;
};

const sendVerificationEmail = async (user, verificationToken) => {
    const verificationLink = buildVerificationLink(verificationToken);

    return sendEmailSafely(
        {
            to: user.email,
            subject: 'Verify your email',
            text: `Your verification token is ${verificationToken}. You can also verify your account using this link: ${verificationLink}`,
            html: `
        <div>
          <p>Hello,</p>
          <p>Please verify your email address.</p>
          <p><strong>Verification token:</strong> ${verificationToken}</p>
          <p><a href="${verificationLink}">Verify Email</a></p>
          <p>This verification token will expire in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
        </div>
      `
        },
        'sendVerificationEmail'
    );
};

const sendPasswordResetEmail = async (user, resetToken) => {
    return sendEmailSafely(
        {
            to: user.email,
            subject: 'Reset your password',
            text: `Your password reset token is ${resetToken}`,
            html: `
        <div>
          <p>Hello,</p>
          <p>Your password reset token is:</p>
          <p><strong>${resetToken}</strong></p>
          <p>This token will expire in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
        </div>
      `
        },
        'sendPasswordResetEmail'
    );
};

const sendBidUpdatedEmail = async ({
                                       to,
                                       fullName,
                                       cycleId,
                                       previousAmount,
                                       newAmount,
                                       featuredDate
                                   }) => {
    const subject = 'Your bid has been updated';
    const text = [
        `Hello ${fullName},`,
        '',
        `Your bid for cycle #${cycleId} has been updated successfully.`,
        `Previous amount: ${previousAmount}`,
        `New amount: ${newAmount}`,
        featuredDate ? `Featured date: ${featuredDate}` : null,
        '',
        'Thank you.'
    ]
        .filter(Boolean)
        .join('\n');

    return sendEmailSafely(
        { to, subject, text },
        'sendBidUpdatedEmail'
    );
};

const sendWinnerSelectedEmail = async ({
                                           to,
                                           fullName,
                                           cycleId,
                                           bidAmount,
                                           featuredDate
                                       }) => {
    const subject = 'Congratulations! Your bid has won';
    const text = [
        `Hello ${fullName},`,
        '',
        `Your bid has been selected as the winning bid for cycle #${cycleId}.`,
        `Winning amount: ${bidAmount}`,
        featuredDate ? `Featured date: ${featuredDate}` : null,
        '',
        'Congratulations.'
    ]
        .filter(Boolean)
        .join('\n');

    return sendEmailSafely(
        { to, subject, text },
        'sendWinnerSelectedEmail'
    );
};

const sendBidPlacedEmail = async ({
                                      to,
                                      fullName,
                                      cycleId,
                                      bidAmount,
                                      featuredDate
                                  }) => {
    const subject = 'Your bid has been placed successfully';
    const text = [
        `Hello ${fullName},`,
        '',
        'Your bid has been placed successfully.',
        `Cycle ID: ${cycleId}`,
        `Bid amount: ${bidAmount}`,
        featuredDate ? `Featured date: ${featuredDate}` : null,
        '',
        'Thank you.'
    ]
        .filter(Boolean)
        .join('\n');

    return sendEmailSafely(
        { to, subject, text },
        'sendBidPlacedEmail'
    );
};

module.exports = {
    verifyTransport,
    sendEmail,
    sendEmailSafely,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBidUpdatedEmail,
    sendWinnerSelectedEmail,
    sendBidPlacedEmail
};