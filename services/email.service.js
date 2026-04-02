const sendEmail = async ({ to, subject, text }) => {
  console.log('Email dispatch simulation:', { to, subject, text });
  return true;
};

module.exports = {
  sendEmail
};
