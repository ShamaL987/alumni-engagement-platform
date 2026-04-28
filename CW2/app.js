require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const legacyApiRoutes = require('./routes/api/legacy');
const { attachUserToViews } = require('./middleware/webAuth.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  name: 'alumni.sid',
  secret: process.env.SESSION_SECRET || 'dev_only_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 3
  }
}));
app.use(flash());
app.use(attachUserToViews);
app.use(requestLogger);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/health', (req, res) => res.json({ success: true, message: 'healthy' }));
app.use('/auth', authLimiter);
app.use('/', legacyApiRoutes);
app.use('/api/auth', authLimiter);
app.use('/api', apiRoutes);

const csrfProtection = csrf();
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use('/', webRoutes);

app.use(errorHandler.notFound);
app.use(errorHandler.handle);

module.exports = app;
