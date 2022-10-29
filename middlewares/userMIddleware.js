import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import util from 'util';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';

export const protectUser = catchAsync(async (req, res, next) => {
  //1). get token from authorization header.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token)
    return next(new AppError('Please login first to get access.', 401));

  //2). verify token if token is not altered in between the request or token is not expired.
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  ); // promisify => to convert a method that returns responses using a callback function to return responses in a promise object

  //3). check if user still exist // if a user logs in and the meantime someone stole the jwt and user gets deleted or user changes it password, in that situation the stolen jwt should not worked ....

  const currentUser = await User.findById(decoded._id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does not exist', 401)
    );

  //4). check if user changed the password after the token was issued.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password ! please login again', 401)
    );
  }
  // finally grant access to protected route.
  req.user = currentUser;
  next();
});

export const restrictTo = (role) => {
  return (req, res, next) => {
    if (role !== req.user.role)
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); // 403 = forbidden.
    next();
  };
};
