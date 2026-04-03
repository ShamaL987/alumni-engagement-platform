const cron = require('node-cron');
const { ensureActiveCycle, processDueCycles } = require('./bid.service');

const startScheduler = async () => {
  await ensureActiveCycle();

  cron.schedule('* * * * *', async () => {
    try {
      await processDueCycles();
    } catch (error) {
    }
  });
};

module.exports = startScheduler;
