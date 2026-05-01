require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const csrf = require('csurf');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const { attachUserToViews } = require('./middleware/webAuth.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const errorHandler = require('./middleware/error.middleware');
const {authLimiter} = require("./middleware/rateLimit.middleware");

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  name: 'alumni.sid',
  secret: process.env.SESSION_SECRET || 'development',
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


app.get('/health', (req, res) => {
  res.json({ success: true, message: 'healthy' });
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

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