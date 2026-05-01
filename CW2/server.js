require('dotenv').config({ quiet: true });

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('SIGTERM', () => {
  console.log('[process] SIGTERM received');
});

const app = require('./app');
const sequelize = require('./config/db');

require('./models');

const startScheduler = require('./services/scheduler.service');
const { seedInitialData } = require('./services/seed.service');
const { verifyTransport } = require('./services/mail.service');

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await sequelize.authenticate();

    const alterDatabase =
        String(process.env.DB_SYNC_ALTER || 'false').toLowerCase() === 'true';

    await sequelize.sync({
      alter: alterDatabase
    });

    await seedInitialData();

    try {
      await verifyTransport();
      console.log('[mail] transport ready');
    } catch (error) {
      console.warn('[mail] transport unavailable:', error.message);
    }

    try {
      startScheduler();
      console.log('[scheduler] started');
    } catch (error) {
      console.warn('[scheduler] failed to start:', error.message);
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`Alumni Influencers MVC app running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

startServer();