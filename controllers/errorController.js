import AppError from '../utils/appError.js';

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  // if operational error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // programming or other unknown error then dont leak error info to client.
    console.log(err);
    res.status(500).json({
      status: 'error',
      message: 'something went wrong!',
    });
  }
};

// ERRORS related to database .... three operatinal error that are genereated by mongoose that are invalid id, duplication of field, validation error . then we dont want to send the complex error object to the client but a clean message regarding that error and informing the client. so we will handle those here in separate functions, process them and then send them to the client.

const handleInvalidIdErrorDb = (err) => {
  const message = `Invalid ${err.path}:${err.value}`; // err.path like id and value is user entered value
  return new AppError(message, 400);
};

const handleDuplicateFieldErrorDb = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError('invalid token please log in again.', 401);

const handleJwtExpire = () =>
  new AppError('your token is expired , login again', 401);

// global controller for errors....

const GlobalErrorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // for sending db errors
    let error = { ...err };
    if (error.name === 'CastError') error = handleInvalidIdErrorDb(error);
    if (error.code === 11000) error = handleDuplicateFieldErrorDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleJwtExpire();

    sendProdError(error, res);
  }
};
export default GlobalErrorController;

// .

// .

// ERROR FLOW :  1. error gets generated in mongoose schema or in any controller.
//               2. it then gets catched by .catch method
//               3. new Error object with that error gets created.
//               4. next(errObj) gets called with error object.
//               5. as soon as next gets called, the global error middleware gets active and receive that error object.
//               6. globa error middleware pass that err obj to global error controller.
//               7. in globa error controller, we send error response to the client according to the type of the error and according to the NODE_ENV variable type.
