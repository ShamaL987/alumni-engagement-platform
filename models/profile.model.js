const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define('Profile', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bio: DataTypes.TEXT,
    linkedin: DataTypes.STRING,
    image: DataTypes.STRING
});

module.exports = Profile;