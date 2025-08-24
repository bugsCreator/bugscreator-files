import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import morgan from 'morgan';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import dotenv from 'dotenv';
import ejsLayouts from 'express-ejs-layouts';
import { apiKeyAuth } from './middlewares/apiKey';

dotenv.config();

// Session types are augmented in types/session.d.ts

const app = express();
const __dirnameSafe = path.resolve();

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugscreator_files_ts';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirnameSafe, 'views'));
app.use(ejsLayouts);
app.set('layout', 'partials/layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('dev'));
// API key auth (non-intrusive; attaches req.apiUser if present)
// app.use(apiKeyAuth);

// Sessions
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: MongoStore.create({ mongoUrl: MONGODB_URI })
  })
);

// Static
app.use('/public', express.static(path.join(__dirnameSafe, 'public')));

// Locals
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Routes
import indexRoutes from './routes/index' ;
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';

console.log('Routes loaded:', {
  indexRoutes: typeof indexRoutes,
  authRoutes: typeof authRoutes,
  fileRoutes: typeof fileRoutes,
});

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

// 404
app.use((req: Request, res: Response) => {
  return res.status(404).render('404', { title: 'Not Found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (req.accepts('html')) {
    return res.status(500).render('error', { title: 'Error', error: err });
  } else {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
