const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Degree = sequelize.define('Degree', {
    userId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    universityUrl: DataTypes.STRING,
    completionDate: DataTypes.DATE
});

module.exports = Degree;