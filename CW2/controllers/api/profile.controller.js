const profileService = require('../../services/profile.service');

const me = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const profile = await profileService.updateMyProfile(req.user.id, req.body, req.file);
    res.status(200).json({
      success: true,
      message: 'Profile saved successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    await profileService.deleteMyProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const addDocument = async (req, res, next) => {
  try {
    const document = await profileService.addDocument(req.user.id, req.body, req.file);
    res.status(201).json({
      success: true,
      message: 'Professional development item added successfully.',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const document = await profileService.updateDocument(req.user.id, req.params.id, req.body, req.file);
    res.status(200).json({
      success: true,
      message: 'Professional development item updated successfully.',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    await profileService.deleteDocument(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Professional development item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const listAlumni = async (req, res, next) => {
  try {
    const alumni = await profileService.listAlumni(req.query);
    res.status(200).json({
      success: true,
      message: 'Alumni profiles retrieved successfully.',
      data: alumni
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  me,
  updateMe,
  deleteMe,
  addDocument,
  updateDocument,
  deleteDocument,
  listAlumni
};
