const User = require('./user.model');
const AuthToken = require('./authToken.model');
const Profile = require('./profile.model');
const ProfileDocument = require('./profileDocument.model');
const BiddingCycle = require('./biddingCycle.model');
const Bid = require('./bid.model');
const BidHistory = require('./bidHistory.model');
const ApiKey = require('./apiKey.model');
const ApiUsageLog = require('./apiUsageLog.model');
const RequestLog = require('./requestLog.model');

User.hasMany(AuthToken, { foreignKey: 'userId', as: 'authTokens', onDelete: 'CASCADE' });
AuthToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Profile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ProfileDocument, { foreignKey: 'userId', as: 'documents', onDelete: 'CASCADE' });
ProfileDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Profile.hasMany(ProfileDocument, { foreignKey: 'profileId', as: 'documents', onDelete: 'CASCADE' });
ProfileDocument.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

User.hasMany(Bid, { foreignKey: 'userId', as: 'bids', onDelete: 'CASCADE' });
Bid.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BiddingCycle.hasMany(Bid, { foreignKey: 'cycleId', as: 'bids', onDelete: 'CASCADE' });
Bid.belongsTo(BiddingCycle, { foreignKey: 'cycleId', as: 'cycle' });

BiddingCycle.belongsTo(Bid, { foreignKey: 'winnerBidId', as: 'winnerBid', constraints: false });
Bid.hasMany(BidHistory, { foreignKey: 'bidId', as: 'historyEntries', onDelete: 'SET NULL' });
BidHistory.belongsTo(Bid, { foreignKey: 'bidId', as: 'bid' });
BiddingCycle.hasMany(BidHistory, { foreignKey: 'cycleId', as: 'historyEntries', onDelete: 'CASCADE' });
BidHistory.belongsTo(BiddingCycle, { foreignKey: 'cycleId', as: 'cycle' });
User.hasMany(BidHistory, { foreignKey: 'userId', as: 'bidHistoryEntries', onDelete: 'SET NULL' });
BidHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(BiddingCycle, { foreignKey: 'winnerUserId', as: 'wonCycles', onDelete: 'SET NULL' });
BiddingCycle.belongsTo(User, { foreignKey: 'winnerUserId', as: 'winnerUser' });

User.hasMany(RequestLog, { foreignKey: 'userId', as: 'requestLogs', onDelete: 'SET NULL' });
RequestLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ApiKey, { foreignKey: 'createdByUserId', as: 'createdApiKeys', onDelete: 'SET NULL' });
ApiKey.belongsTo(User, { foreignKey: 'createdByUserId', as: 'creator' });
ApiKey.hasMany(ApiUsageLog, { foreignKey: 'apiKeyId', as: 'usageLogs', onDelete: 'SET NULL' });
ApiUsageLog.belongsTo(ApiKey, { foreignKey: 'apiKeyId', as: 'apiKey' });
User.hasMany(ApiUsageLog, { foreignKey: 'userId', as: 'apiUsageLogs', onDelete: 'SET NULL' });
ApiUsageLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  AuthToken,
  Profile,
  ProfileDocument,
  BiddingCycle,
  Bid,
  BidHistory,
  ApiKey,
  ApiUsageLog,
  RequestLog,
};
