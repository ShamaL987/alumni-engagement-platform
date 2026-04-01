const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Featured = sequelize.define('Featured', {
    userId: DataTypes.INTEGER,
    bidId: DataTypes.INTEGER,
    date: {
        type: DataTypes.DATEONLY
    }
},
    {
        indexes: [
            { fields: ['date'] },
            { fields: ['userId'] }
        ]
    }
);

module.exports = Featured;