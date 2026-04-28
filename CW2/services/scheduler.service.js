const cron = require('node-cron');
const { ensureActiveCycle, processDueCycles } = require('./bid.service');

let isRunning = false;

function startScheduler() {
  ensureActiveCycle().catch((error) => console.warn('[scheduler] initial cycle failed:', error.message));

  cron.schedule('* * * * *', async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      await ensureActiveCycle();
      await processDueCycles();
    } catch (error) {
      console.error('[scheduler] failed:', error.message);
    } finally {
      isRunning = false;
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      await processDueCycles();
      await ensureActiveCycle();
    } catch (error) {
      console.error('[scheduler-midnight] failed:', error.message);
    }
  });
}

module.exports = startScheduler;
