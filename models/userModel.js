import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    // default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password; // el is passwordConfirm and if same it will return true and no validation error. this is only gonna work on save() and create().
      },
      message: 'Passwords are not the same !',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// schema end's here.

// using mongoose presave middleware that will call before saving the doc to db for encrypting password....

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // if the password is not changed or created then simply return.

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; // delete after confirming the passwords are same.
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// instance methods that will be available in all the user documents or instances and we can call them in our controller.
userSchema.methods.comparePassword = async function (
  candidatePassword,
  actualPassword
) {
  return await bcrypt.compare(candidatePassword, actualPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    const isChanged = JWTTimestamp < changedTimeStamp ? true : false;

    return isChanged;
  }
  // false means not changed....
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre(/^find/, function (next) {
  // this points to current query// a query middleware.

  this.find({ active: { $ne: false } });

  next();
});

const User = mongoose.model('User', userSchema);
export default User;
