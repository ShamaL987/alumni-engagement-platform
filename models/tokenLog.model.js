const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TokenLog = sequelize.define('TokenLog', {
    userId: DataTypes.INTEGER,
    endpoint: DataTypes.STRING,
    method: DataTypes.STRING,
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
},
    {
        indexes: [
            { fields: ['userId'] },
            { fields: ['timestamp'] }
        ]
    }
);

module.exports = TokenLog;