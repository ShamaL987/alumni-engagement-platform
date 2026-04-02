const { Profile } = require('../models');
const { isArray, isValidUrl } = require('../utils/validators');

const assertArray = (fieldName, value) => {
  if (value !== undefined && !isArray(value)) {
    const error = new Error(`${fieldName} must be an array`);
    error.statusCode = 400;
    throw error;
  }
};

const assertUrl = (fieldName, value) => {
  if (!isValidUrl(value)) {
    const error = new Error(`${fieldName} must be a valid URL`);
    error.statusCode = 400;
    throw error;
  }
};

const validateProfilePayload = (payload) => {
  assertUrl('linkedInUrl', payload.linkedInUrl);
  assertArray('degrees', payload.degrees);
  assertArray('certifications', payload.certifications);
  assertArray('licences', payload.licences);
  assertArray('shortCourses', payload.shortCourses);
  assertArray('employmentHistory', payload.employmentHistory);

  const collections = [
    { key: 'degrees', urlKey: 'degreeUrl' },
    { key: 'certifications', urlKey: 'courseUrl' },
    { key: 'licences', urlKey: 'awardingBodyUrl' },
    { key: 'shortCourses', urlKey: 'courseUrl' }
  ];

  for (const collection of collections) {
    for (const item of payload[collection.key] || []) {
      if (item[collection.urlKey] !== undefined && !isValidUrl(item[collection.urlKey])) {
        const error = new Error(`${collection.key} contains an invalid URL`);
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

const getProfileByUserId = async (userId) => {
  return Profile.findOne({ where: { userId } });
};

const createOrReplaceProfile = async (userId, payload, imagePath) => {
  validateProfilePayload(payload);

  const existingProfile = await getProfileByUserId(userId);
  const values = {
    userId,
    fullName: payload.fullName || null,
    biography: payload.biography || null,
    linkedInUrl: payload.linkedInUrl || null,
    profileImagePath: imagePath || payload.profileImagePath || existingProfile?.profileImagePath || null,
    degrees: payload.degrees || [],
    certifications: payload.certifications || [],
    licences: payload.licences || [],
    shortCourses: payload.shortCourses || [],
    employmentHistory: payload.employmentHistory || [],
    monthlyEventBonusCount: Number(payload.monthlyEventBonusCount || existingProfile?.monthlyEventBonusCount || 0)
  };

  if (existingProfile) {
    await existingProfile.update(values);
    return existingProfile;
  }

  return Profile.create(values);
};

const updateProfile = async (userId, payload, imagePath) => {
  validateProfilePayload(payload);

  const profile = await getProfileByUserId(userId);
  if (!profile) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  const updateValues = { ...payload };

  if (imagePath) {
    updateValues.profileImagePath = imagePath;
  }

  await profile.update(updateValues);
  return profile;
};

const deleteProfile = async (userId) => {
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  await profile.destroy();
};

module.exports = {
  getProfileByUserId,
  createOrReplaceProfile,
  updateProfile,
  deleteProfile
};
