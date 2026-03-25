const Degree = require('../models/degree.model');

exports.addDegree = async (req, res) => {
    const { title, universityUrl, completionDate } = req.body;

    const degree = await Degree.create({
        userId: req.user.id,
        title,
        universityUrl,
        completionDate
    });

    res.json(degree);
};