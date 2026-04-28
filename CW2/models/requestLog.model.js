const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RequestLog = sequelize.define('request_log', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  endpoint: { type: DataTypes.STRING(500), allowNull: false },
  method: { type: DataTypes.STRING(10), allowNull: false },
  statusCode: { type: DataTypes.INTEGER, allowNull: false },
  tokenSubject: { type: DataTypes.STRING(100), allowNull: true },
  ipAddress: { type: DataTypes.STRING(80), allowNull: true }
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = RequestLog;
