require('dotenv').config();
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
    const alter = String(process.env.DB_SYNC_ALTER || 'true').toLowerCase() === 'true';
    await sequelize.sync({ alter });
    await seedInitialData();

    try {
      await verifyTransport();
      console.log('[mail] transport ready');
    } catch (error) {
      console.warn('[mail] transport unavailable:', error.message);
    }

    startScheduler();

    app.listen(port, () => {
      console.log(`Alumni Influencers MVC app running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startServer();
