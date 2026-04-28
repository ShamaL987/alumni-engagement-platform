const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiKey = sequelize.define('api_key', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  clientType: {
    type: DataTypes.ENUM('analytics_dashboard', 'mobile_ar_app', 'custom'),
    allowNull: false,
    defaultValue: 'custom'
  },
  keyPrefix: { type: DataTypes.STRING(24), allowNull: false, unique: true },
  keyHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
  revokedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { unique: true, fields: ['key_prefix'] },
    { fields: ['client_type'] },
    { fields: ['is_active'] }
  ]
});

module.exports = ApiKey;
