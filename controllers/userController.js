import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  //1.) create error if user post password data.

  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('You cant update your password here!'), 400);

  //2.) filter unwanted fields that are not allowed to be updated here....
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3.) simply update user document.

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  }); // we are using findbyidandupdate here because we are using password here.... only updating name and email here....

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

// when user wants to delete the account, we dont actually delete that account but make that inactive so that if user wants to activate his account later he can activate that.

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
