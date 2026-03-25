const cron = require('node-cron');
const Bid = require('../models/bid.model');
const { sendEmail } = require('./email.service');

cron.schedule('0 0 * * *', async () => {
    console.log('Running daily winner selection');

    const highest = await Bid.findOne({
        order: [['amount', 'DESC']]
    });

    if (highest) {
        highest.status = 'won';
        await highest.save();

        // ✅ notify winner
        sendEmail(
            'user@example.com',
            'You Won!',
            `Congratulations! Your bid of ${highest.amount} won`
        );
    }
});