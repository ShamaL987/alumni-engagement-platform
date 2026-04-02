const isUniversityEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return false;
  }

  const expectedDomain = String(process.env.UNIVERSITY_EMAIL_DOMAIN || '').toLowerCase();
  const actualDomain = email.split('@')[1]?.toLowerCase();
  return actualDomain === expectedDomain;
};

const isStrongPassword = (password) => {
  if (typeof password !== 'string') {
    return false;
  }

  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
};

const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};

const isArray = (value) => Array.isArray(value);

module.exports = {
  isUniversityEmail,
  isStrongPassword,
  isValidUrl,
  isArray
};
