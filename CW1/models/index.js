const User = require('./user.model');
const AuthToken = require('./authToken.model');
const Profile = require('./profile.model');
const BiddingCycle = require('./biddingCycle.model');
const Bid = require('./bid.model');
const BidHistory = require('./bidHistory.model');
const RequestLog = require('./requestLog.model');

User.hasMany(AuthToken, { foreignKey: 'userId', as: 'authTokens' });
AuthToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Bid, { foreignKey: 'userId', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'userId', as: 'user' });

BiddingCycle.hasMany(Bid, { foreignKey: 'cycleId', as: 'bids' });
Bid.belongsTo(BiddingCycle, { foreignKey: 'cycleId', as: 'cycle' });

BiddingCycle.belongsTo(Bid, { foreignKey: 'winnerBidId', as: 'winnerBid' });
Bid.hasMany(BidHistory, { foreignKey: 'bidId', as: 'historyEntries' });
BidHistory.belongsTo(Bid, { foreignKey: 'bidId', as: 'bid' });

BiddingCycle.hasMany(BidHistory, { foreignKey: 'cycleId', as: 'historyEntries' });
BidHistory.belongsTo(BiddingCycle, { foreignKey: 'cycleId', as: 'cycle' });

User.hasMany(BidHistory, { foreignKey: 'userId', as: 'bidHistoryEntries' });
BidHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(BiddingCycle, { foreignKey: 'winnerUserId', as: 'wonCycles' });
BiddingCycle.belongsTo(User, { foreignKey: 'winnerUserId', as: 'winnerUser' });

User.hasMany(RequestLog, { foreignKey: 'userId', as: 'requestLogs' });
RequestLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  AuthToken,
  Profile,
  BiddingCycle,
  Bid,
  BidHistory,
  RequestLog
};
