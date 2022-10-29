import express from 'express';
import {
  forgotPassword,
  login,
  resetPassword,
  signUp,
  updatePassword,
} from '../controllers/authController.js';
import {
  deleteMe,
  getAllUsers,
  updateMe,
} from '../controllers/userController.js';
import { protectUser, restrictTo } from '../middlewares/userMIddleware.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// PROTECTED Routes....
router.patch('/updatePassword', protectUser, updatePassword);

router.patch('/updateMe', protectUser, updateMe);

router.delete('/deleteMe', protectUser, deleteMe);

router.route('/').get(protectUser, restrictTo('admin'), getAllUsers);

export default router;
