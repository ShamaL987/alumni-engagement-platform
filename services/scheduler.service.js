const cron = require('node-cron');
const { ensureActiveCycle, processDueCycles } = require('./bid.service');

let isCycleJobRunning = false;

const startScheduler = () => {
  cron.schedule('* * * * *', async () => {
    if (isCycleJobRunning) {
      return;
    }

    isCycleJobRunning = true;

    try {
      await ensureActiveCycle();
      await processDueCycles();
    } catch (error) {
      console.error('Scheduler error:', error.message);
    } finally {
      isCycleJobRunning = false;
    }
  });
};

module.exports = startScheduler;