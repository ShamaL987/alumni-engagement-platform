const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('alumni', 'client', 'admin'),
    allowNull: false,
    defaultValue: 'alumni'
  },
  isEmailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['role'] }
  ]
});

module.exports = User;
