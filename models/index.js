const User = require('./user.model');
const Profile = require('./profile.model');
const Degree = require('./degree.model');
const Certification = require('./certification.model');
const Employment = require('./employment.model');
const Bid = require('./bid.model');

// RELATIONS
User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User);

User.hasMany(Degree);
Degree.belongsTo(User);

User.hasMany(Certification);
Certification.belongsTo(User);

User.hasMany(Employment);
Employment.belongsTo(User);

User.hasMany(Bid);
Bid.belongsTo(User);

module.exports = {
    User,
    Profile,
    Degree,
    Certification,
    Employment,
    Bid
};