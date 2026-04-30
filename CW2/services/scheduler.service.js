const cron = require('node-cron');
const { ensureActiveCycle, processDueCycles } = require('./bid.service');

let isCycleJobRunning = false;

async function runCycleJob(jobName) {
  if (isCycleJobRunning) {
    return;
  }

  isCycleJobRunning = true;

  try {
    await processDueCycles();
    await ensureActiveCycle();
  } catch (error) {
    console.error(`[${jobName}] Scheduler error:`, error.message);
  } finally {
    isCycleJobRunning = false;
  }
}

const startScheduler = () => {
  runCycleJob('startup');

  cron.schedule('* * * * *', async () => {
    await runCycleJob('cycle-check');
  });
};

module.exports = startScheduler;