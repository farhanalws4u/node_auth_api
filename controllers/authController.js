import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';

const signToken = (id) => {
  return jwt.sign({ _id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    // secure:true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove the password from the output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  // login based on email and password.

  const { email, password } = req.body;

  //1) check if email and password exist.
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 404));
  }

  //2) check is user exists and password is correct.
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) if everything ok, send token back to the client.
  createSendToken(user, 201, res);
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  //1.) get user based on posted email.
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('There is no user with that email address', 404));

  //2.) generate the random token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // to avoid required field error

  //3.) send token back in email.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a patch request with your new password and passwordConfirm to : ${resetURL}.\n\n If you didn't forget your password please ignore this.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email!',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error sending the email try again later.')
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  //1.) get user based on the token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // also check if token not expired...it will return user if token is not expired.
  });

  //2.)if token has not expired and there is user, set the new password.
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3.) update changedPasswordAt property for the user. // applied in pre save middleware.

  //4. log the user in , send jwt.
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  //1.) get the user from collection.
  const user = await User.findById(req.user._id).select('+password');

  //2.) check if posted current password is correct ?
  if (!(await user.comparePassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3.) if so, update the password.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4.) log in user, send jwt.
  createSendToken(user, 200, res);
});
