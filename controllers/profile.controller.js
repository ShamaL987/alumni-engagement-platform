const Profile = require('../models/profile.model');

// CREATE PROFILE
exports.createProfile = async (req, res) => {
    const { bio, linkedin } = req.body;

    const profile = await Profile.create({
        userId: req.user.id,
        bio,
        linkedin
    });

    res.json(profile);
};

// GET PROFILE
exports.getProfile = async (req, res) => {
    const profile = await Profile.findOne({
        where: { userId: req.user.id }
    });

    res.json(profile);
};