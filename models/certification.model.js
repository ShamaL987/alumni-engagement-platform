const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Certification = sequelize.define('Certification', {
    userId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    url: DataTypes.STRING,
    type: DataTypes.STRING,
    completionDate: DataTypes.DATE
},
    {
        indexes: [
            { fields: ['userId'] },
            { fields: ['type'] }
        ]
    }
);

module.exports = Certification;