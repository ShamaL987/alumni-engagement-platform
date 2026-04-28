function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function isUniversityEmail(email) {
  if (!email || !email.includes('@')) return false;
  const shouldEnforce = String(process.env.ENFORCE_UNIVERSITY_DOMAIN || 'false').toLowerCase() === 'true';
  if (!shouldEnforce) return true;
  const domain = email.split('@').pop().toLowerCase();
  const allowed = String(process.env.UNIVERSITY_EMAIL_DOMAINS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`));
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function cleanString(value, maxLength = 500) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/[<>]/g, '').slice(0, maxLength);
}

module.exports = { isStrongPassword, isUniversityEmail, normalizeArray, isValidUrl, cleanString };
