const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BiddingCycle = sequelize.define('bidding_cycle', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  featuredDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'processing', 'processed'),
    allowNull: false,
    defaultValue: 'active'
  },
  winnerBidId: { type: DataTypes.INTEGER, allowNull: true },
  winnerUserId: { type: DataTypes.INTEGER, allowNull: true },
  processedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { fields: ['status', 'end_time'] },
    { fields: ['featured_date'] },
    { fields: ['winner_user_id'] }
  ]
});

module.exports = BiddingCycle;
