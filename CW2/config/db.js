const { Sequelize } = require('sequelize');

const database =
    process.env.MYSQLDATABASE ||
    process.env.MYSQL_DATABASE ||
    process.env.DB_NAME ||
    'alumni_cw2_mvc';

const username =
    process.env.MYSQLUSER ||
    process.env.DB_USER ||
    'root';

const password =
    process.env.MYSQLPASSWORD ||
    process.env.MYSQL_ROOT_PASSWORD ||
    process.env.DB_PASSWORD ||
    '';

const host =
    process.env.MYSQLHOST ||
    process.env.DB_HOST ||
    '127.0.0.1';

const port = Number(
    process.env.MYSQLPORT ||
    process.env.DB_PORT ||
    3306
);

console.log('[db] config:', {
    host,
    port,
    database,
    username,
    hasPassword: Boolean(password)
});

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