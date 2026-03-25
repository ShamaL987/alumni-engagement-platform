const Certification = require('../models/certification.model');

exports.addCertification = async (req, res) => {
    const { title, courseUrl, completionDate } = req.body;

    const cert = await Certification.create({
        userId: req.user.id,
        title,
        courseUrl,
        completionDate
    });

    res.json(cert);
};