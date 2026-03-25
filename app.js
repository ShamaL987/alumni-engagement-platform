const express = require('express');
const app = express();
const profileRoutes = require('./routes/profile.routes');
const bidRoutes = require('./routes/bid.routes');
const degreeRoutes = require('./routes/degree.routes');
const certRoutes = require('./routes/certification.routes');
const employmentRoutes = require('./routes/employment.routes');

app.use(express.json());

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

app.use('/profile', profileRoutes);
app.use('/bids', bidRoutes);
app.use('/degree', degreeRoutes);
app.use('/certifications', certRoutes);
app.use('/employment', employmentRoutes);

module.exports = app;