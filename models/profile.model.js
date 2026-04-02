const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define(
  'profile',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    linkedInUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    profileImagePath: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    degrees: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    licences: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    shortCourses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    employmentHistory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    monthlyEventBonusCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    indexes: [{ unique: true, fields: ['user_id'] }]
  }
);

module.exports = Profile;
