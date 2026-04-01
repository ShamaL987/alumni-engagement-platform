require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/db');
require('./services/cron.service');

sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
});