const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bid = sequelize.define('Bid',
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
    {
        indexes: [
            { fields: ['userId'] },
            { fields: ['amount'] }
        ]
    }
);

module.exports = Bid;