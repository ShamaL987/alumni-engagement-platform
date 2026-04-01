const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employment = sequelize.define('Employment', {
    userId: DataTypes.INTEGER,
    company: DataTypes.STRING,
    role: DataTypes.STRING,
    startDate: DataTypes.DATE,
    endDate: DataTypes.DATE
});

module.exports = Employment;