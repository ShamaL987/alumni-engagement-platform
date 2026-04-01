const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bid = sequelize.define('Bid', {
    userId: DataTypes.INTEGER,
    amount: DataTypes.FLOAT,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Bid;