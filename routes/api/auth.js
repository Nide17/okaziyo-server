const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require('config')
const router = express.Router();
const { auth } = require('../../middleware/auth');
const sendEmail = require("./pswd-reset/sendEmail");

// User Model
const User = require('../../models/User');
const PswdResetToken = require('../../models/PswdResetToken');

// @route   POST api/auth/login
// @desc    Login user
// @access  Public

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please fill all the fields' });
  }

  try {
    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) throw Error('The user does not exist!');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw Error('The E-mail or password is incorrect!');

    // Sign and generate token
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || config.get('jwtSecret'),
      { expiresIn: '2h' }
    );

    if (!token) throw Error('Couldnt sign in, try again!');

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   POST api/auth/register
// @desc    Register new user
// @access  Public

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const emailTest = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  const pswdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please fill all the fields' });
  }

  else if (!emailTest.test(email)) {
    return res.status(400).json({ msg: 'Please provide a valid email!' });
  }

    else if (!pswdRegex.test(password)) {
      return res.status(400).json({ msg: 'Password should be greater than 7 and having special characters, number, and uppercase and lowercase letters' });
  }

  try {
    const user = await User.findOne({ email });
    if (user) throw Error('The user already exists');

    // Create salt and hash
    const salt = await bcrypt.genSalt(10);
    if (!salt) throw Error('Something went wrong with bcrypt');

    const hash = await bcrypt.hash(password, salt);
    if (!hash) throw Error('Something went wrong hashing the password');

    const newUser = new User({
      name,
      email,
      password: hash
    });

    const savedUser = await newUser.save();
    if (!savedUser) throw Error('Something went wrong saving the user');

    sendEmail(
      savedUser.email,
      "Welcome to Okaziyo, your account is created!",
      {
        name: savedUser.name,
      },
      "./template/welcome.handlebars");

    // Sign and generate token
    const token = jwt.sign(
      {
        _id: savedUser._id,
        role: savedUser.role
      },
      process.env.JWT_SECRET || config.get('jwtSecret'),
      { expiresIn: '2h' }
    );

    res.status(200).json({
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route  POST api/auth/forgot-password
// @desc    
// @access  

router.post('/forgot-password', async (req, res) => {

  const email = req.body.email

  try {
    const userToReset = await User.findOne({ email });

    if (!userToReset) throw Error('The user does not exist');

    res.json(userToReset);

    // check if there is an existing token for this user & delete it.
    let tokn = await PswdResetToken.findOne({ userId: userToReset._id });
    if (tokn) {
      await tokn.deleteOne()
    };

    // create a new random token 
    let resetToken = crypto.randomBytes(32).toString("hex");

    // Create salt and hash
    const salt = await bcrypt.genSalt(10);
    if (!salt) throw Error('Something went wrong with bcrypt');

    const hash = await bcrypt.hash(resetToken, salt);

    await new PswdResetToken({
      userId: userToReset._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const clientURL = process.env.NODE_ENV === 'production' ?
      'http://www.okaziyo.com' : 'http://localhost:3000'

    const link = `${clientURL}/reset-password?token=${resetToken}&id=${userToReset._id}`;

    sendEmail(
      userToReset.email,
      "Password reset for your Okaziyo account!",
      {
        name: userToReset.name,
        link: link,
      },
      "./template/requestResetPassword.handlebars"
    );

    return link;

  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   POST api/auth/reset-password
// @desc    
// @access  

router.post('/reset-password', async (req, res) => {

  const { userId, token, password } = req.body;

  try {

  let passwordResetToken = await PswdResetToken.findOne({ userId });
  if (!passwordResetToken) throw Error('Invalid or expired password reset token');

  const isValid = await bcrypt.compare(token, passwordResetToken.token);
  if (!isValid) throw Error('Invalid or expired password reset token');

  // Create salt and hash
  const salt = await bcrypt.genSalt(10);
  if (!salt) throw Error('Something went wrong with bcrypt');

  const hash = await bcrypt.hash(password, salt);

  // process sent new data
  await User.updateOne(
    { _id: userId },
    { $set: { password: hash } },
    { new: true }
  );

  const resetUser = await User.findById({ _id: userId });

  sendEmail(
    resetUser.email,
    "Password reset for your Okaziyo account is successful!",
    {
      name: resetUser.name,
    },
    "./template/resetPassword.handlebars");

  await passwordResetToken.deleteOne();

  return true;
  
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
})

// @route   GET api/auth/user
// @desc    Get user data to keep logged in user token bcz jwt data are stateless
// @access  Private: Accessed by any logged in user

router.get('/user', auth, async (req, res) => {

  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) throw Error('This user does not exist');
    res.json(user);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;