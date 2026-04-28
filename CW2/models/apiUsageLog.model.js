const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiUsageLog = sequelize.define('api_usage_log', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  apiKeyId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  endpoint: { type: DataTypes.STRING(500), allowNull: false },
  method: { type: DataTypes.STRING(10), allowNull: false },
  statusCode: { type: DataTypes.INTEGER, allowNull: false },
  ipAddress: { type: DataTypes.STRING(80), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true },
  permissionsUsed: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }
}, {
  indexes: [
    { fields: ['api_key_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = ApiUsageLog;
