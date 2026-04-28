const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bid = sequelize.define('bid', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  cycleId: { type: DataTypes.INTEGER, allowNull: false },
  bidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0.01 }
  },
  bidAttemptCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'won', 'lost'),
    allowNull: false,
    defaultValue: 'active'
  },
  selectedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { fields: ['user_id', 'cycle_id'] },
    { fields: ['cycle_id', 'status', 'bid_amount'] },
    { fields: ['user_id', 'created_at'] }
  ]
});

module.exports = Bid;
