exports.sendEmail = (email, subject, message) => {
    console.log(`
    📧 Sending Email:
    To: ${email}
    Subject: ${subject}
    Message: ${message}
    `);
};