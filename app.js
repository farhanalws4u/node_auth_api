import express from 'express';
import GlobalErrorController from './controllers/errorController.js';
import AppError from './utils/appError.js';
import userRoutes from './routes/userRoutes.js';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

const app = express();

// GLOBAL MIIDDLEWARES.

// setting secuirty http header.
app.use(helmet());

// to limit too many request from one source. preventing DDOS and Brute force attack.
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter);

// body parser, reading data from req.body
app.use(express.json({ limit: '10kb', extended: true }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data sanitization against NOSQL query injection.
app.use(ExpressMongoSanitize());

// Data sanitization against cross site scripting attack.
app.use(xss());

// preventing parameter pollution.
app.use(hpp());

// ROUTES...

app.use('/api/v1/users', userRoutes);

// handling unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this server`, 404));
});

// global error handling middleware to handle errors all over the app. it will called when we call next with and error object as argument.like next(err);

app.use(GlobalErrorController);

export default app;
