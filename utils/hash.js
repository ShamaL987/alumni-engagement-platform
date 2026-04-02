const bcrypt = require('bcrypt');

const getSaltRounds = () => Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const hashPassword = async (password) => bcrypt.hash(password, getSaltRounds());
const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = {
  hashPassword,
  comparePassword
};
