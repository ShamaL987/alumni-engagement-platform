const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProfileDocument = sequelize.define('profile_document', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  profileId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  documentType: {
    type: DataTypes.ENUM('degree', 'certification', 'licence', 'short_course', 'employment_evidence', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  issuer: { type: DataTypes.STRING(200), allowNull: true },
  filePath: { type: DataTypes.STRING(500), allowNull: true },
  externalUrl: { type: DataTypes.STRING(500), allowNull: true },
  issuedAt: { type: DataTypes.DATEONLY, allowNull: true },
  expiresAt: { type: DataTypes.DATEONLY, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  indexes: [
    { fields: ['profile_id'] },
    { fields: ['user_id'] },
    { fields: ['document_type'] }
  ]
});

module.exports = ProfileDocument;
