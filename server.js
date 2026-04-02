require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const startScheduler = require('./services/scheduler.service');
require('./models');

const port = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    startScheduler();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
