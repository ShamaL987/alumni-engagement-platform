const cron = require('node-cron');
const { ensureActiveCycle, processDueCycles } = require('./bid.service');

const startScheduler = async () => {
  await ensureActiveCycle();

  cron.schedule('* * * * *', async () => {
    try {
      await processDueCycles();
      console.log('Bidding cycle scheduler heartbeat completed successfully');
    } catch (error) {
      console.error('Bidding cycle scheduler failed:', error.message);
    }
  });
};

module.exports = startScheduler;
