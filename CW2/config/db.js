const { Sequelize } = require('sequelize');

const commonOptions = {
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
};

let sequelize;

if (process.env.MYSQL_URL) {
    console.log('[db] using MYSQL_URL connection');

    sequelize = new Sequelize(process.env.MYSQL_URL, commonOptions);
} else {
    const isRailwayMysql = Boolean(
        process.env.MYSQLHOST &&
        process.env.MYSQLPORT &&
        process.env.MYSQLUSER &&
        process.env.MYSQLPASSWORD &&
        process.env.MYSQLDATABASE
    );

    const database = isRailwayMysql
        ? process.env.MYSQLDATABASE
        : process.env.DB_NAME || 'alumni_cw2_mvc';

    const username = isRailwayMysql
        ? process.env.MYSQLUSER
        : process.env.DB_USER || 'root';

    const password = isRailwayMysql
        ? process.env.MYSQLPASSWORD
        : process.env.DB_PASSWORD || '';

    const host = isRailwayMysql
        ? process.env.MYSQLHOST
        : process.env.DB_HOST || '127.0.0.1';

    const port = Number(
        isRailwayMysql
            ? process.env.MYSQLPORT
            : process.env.DB_PORT || 3306
    );

    console.log('[db] config:', {
        source: isRailwayMysql ? 'railway-mysql' : 'local-db',
        host,
        port,
        database,
        username,
        hasPassword: Boolean(password)
    });

    sequelize = new Sequelize(database, username, password, {
        ...commonOptions,
        host,
        port
    });
}

module.exports = sequelize;