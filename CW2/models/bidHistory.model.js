const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BidHistory = sequelize.define('bid_history', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cycleId: { type: DataTypes.INTEGER, allowNull: false },
  bidId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: {
    type: DataTypes.ENUM('created', 'increased', 'cancelled', 'won', 'lost', 'cycle_processed_no_winner'),
    allowNull: false
  },
  previousAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  newAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  note: { type: DataTypes.STRING(255), allowNull: true }
}, {
  indexes: [
    { fields: ['cycle_id', 'created_at'] },
    { fields: ['bid_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = BidHistory;
