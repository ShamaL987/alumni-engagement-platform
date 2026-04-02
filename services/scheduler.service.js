const cron = require('node-cron');
const { processWinnerSelectionForDate } = require('./bid.service');

const startScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await processWinnerSelectionForDate(today);
      console.log(`Processed winner selection for ${today}`);
    } catch (error) {
      console.error('Winner selection failed:', error.message);
    }
  });
};

module.exports = startScheduler;
