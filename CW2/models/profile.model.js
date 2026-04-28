const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define('profile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING(150), allowNull: true },
  biography: { type: DataTypes.TEXT, allowNull: true },
  linkedInUrl: { type: DataTypes.STRING(500), allowNull: true },
  profileImagePath: { type: DataTypes.STRING(500), allowNull: true },
  programme: { type: DataTypes.STRING(150), allowNull: true },
  graduationYear: { type: DataTypes.INTEGER, allowNull: true },
  graduationDate: { type: DataTypes.DATEONLY, allowNull: true },
  industrySector: { type: DataTypes.STRING(150), allowNull: true },
  currentJobTitle: { type: DataTypes.STRING(150), allowNull: true },
  employer: { type: DataTypes.STRING(150), allowNull: true },
  country: { type: DataTypes.STRING(100), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  skills: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  degrees: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  certifications: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  licences: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  shortCourses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  employmentHistory: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  monthlyEventBonusCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  indexes: [
    { unique: true, fields: ['user_id'] },
    { fields: ['programme'] },
    { fields: ['graduation_year'] },
    { fields: ['industry_sector'] }
  ]
});

module.exports = Profile;
