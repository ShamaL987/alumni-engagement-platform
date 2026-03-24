const express = require('express');
const app = express();

require('dotenv').config();

app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.listen(process.env.PORT, () => {
    console.log("Server started...");
});
