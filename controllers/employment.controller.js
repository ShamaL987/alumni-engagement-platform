const Employment = require('../models/employment.model');

exports.addEmployment = async (req, res) => {
    const { company, role, startDate, endDate } = req.body;

    const job = await Employment.create({
        userId: req.user.id,
        company,
        role,
        startDate,
        endDate
    });

    res.json(job);
};
