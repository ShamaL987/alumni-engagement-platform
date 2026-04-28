const profileService = require('../../services/profile.service');

exports.me = async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.user.id);
  res.json({ success: true, data: profile });
};

exports.updateMe = async (req, res) => {
  const profile = await profileService.updateMyProfile(req.user.id, req.body, req.file);
  res.json({ success: true, data: profile });
};

exports.deleteMe = async (req, res) => {
  await profileService.deleteMyProfile(req.user.id);
  res.json({ success: true, message: 'Profile deleted successfully' });
};

exports.addDocument = async (req, res) => {
  const document = await profileService.addDocument(req.user.id, req.body, req.file);
  res.status(201).json({ success: true, data: document });
};

exports.updateDocument = async (req, res) => {
  const document = await profileService.updateDocument(req.user.id, req.params.id, req.body, req.file);
  res.json({ success: true, data: document });
};

exports.deleteDocument = async (req, res) => {
  await profileService.deleteDocument(req.user.id, req.params.id);
  res.json({ success: true, message: 'Professional development item deleted successfully' });
};

exports.listAlumni = async (req, res) => {
  const alumni = await profileService.listAlumni(req.query);
  res.json({ success: true, data: alumni });
};
