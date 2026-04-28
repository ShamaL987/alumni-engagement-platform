const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuthToken = sequelize.define(
  'auth_token',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('email_verification', 'password_reset'),
      allowNull: false
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    indexes: [
      { fields: ['user_id', 'type'] },
      { unique: true, fields: ['token_hash'] }
    ]
  }
);

module.exports = AuthToken;
