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
    },
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
};

let sequelize;

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (databaseUrl) {
    console.log('[db] using database URL connection');

    sequelize = new Sequelize(databaseUrl, {
        ...commonOptions,
        dialectOptions: {
            ssl: { rejectUnauthorized: false }
        }
    });
} else {
    const database = process.env.DB_NAME || 'alumni_cw2_mvc';
    const username = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = Number(process.env.DB_PORT || 3306);

    console.log('[db] using local DB config:', {
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

sequelize.authenticate()
    .then(() => console.log('[db] connection established successfully'))
    .catch(err => {
        console.error('[db] unable to connect to the database:', err.message);
        process.exit(1);
    });

module.exports = sequelize;