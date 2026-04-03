const profileService = require('../services/profile.service');

const parsePayload = (body) => {
  const parsed = { ...body };
  const jsonFields = ['degrees', 'certifications', 'licences', 'shortCourses', 'employmentHistory'];

  for (const field of jsonFields) {
    if (typeof parsed[field] === 'string') {
      parsed[field] = JSON.parse(parsed[field]);
    }
  }

  if (typeof parsed.monthlyEventBonusCount === 'string') {
    parsed.monthlyEventBonusCount = Number(parsed.monthlyEventBonusCount);
  }

  return parsed;
};


const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const createOrReplaceProfile = async (req, res, next) => {
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const profile = await profileService.createOrReplaceProfile(req.user.id, parsePayload(req.body), imagePath);
    res.status(200).json({
      success: true,
      message: 'Profile saved successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const profile = await profileService.updateProfile(req.user.id, parsePayload(req.body), imagePath);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const authService = require('../services/auth.service');

const deleteProfile = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Account and profile deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyProfile,
  createOrReplaceProfile,
  updateProfile,
  deleteProfile
};
