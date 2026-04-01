const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Certification = sequelize.define('Certification', {
    userId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    courseUrl: DataTypes.STRING,
    completionDate: DataTypes.DATE
});

module.exports = Certification;