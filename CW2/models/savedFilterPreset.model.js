const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SavedFilterPreset = sequelize.define('saved_filter_preset', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  filters: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }
}, {
  indexes: [
    { fields: ['user_id'] },
    { unique: true, fields: ['user_id', 'name'] }
  ]
});

module.exports = SavedFilterPreset;
