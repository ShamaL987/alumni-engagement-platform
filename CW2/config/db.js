const { Sequelize } = require('sequelize');

const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'alumni_cw2_mvc';
const username = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

const sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
    logging: String(process.env.DB_LOGGING || 'false').toLowerCase() === 'true' ? console.log : false,
    define: {
        underscored: true,
        timestamps: true,
        freezeTableName: true
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;