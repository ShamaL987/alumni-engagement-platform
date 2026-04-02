const User = require('./user.model');
const AuthToken = require('./authToken.model');
const Profile = require('./profile.model');
const Bid = require('./bid.model');
const RequestLog = require('./requestLog.model');

User.hasMany(AuthToken, { foreignKey: 'userId', as: 'authTokens' });
AuthToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Bid, { foreignKey: 'userId', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RequestLog, { foreignKey: 'userId', as: 'requestLogs' });
RequestLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  AuthToken,
  Profile,
  Bid,
  RequestLog
};
