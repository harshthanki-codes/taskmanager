const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const { log } = require('../services/activityLog.service');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists',
      });
    }

    // First user becomes admin
    const isFirstUser = (await User.countDocuments()) === 0;

    const user = await User.create({
      name,
      email,
      password,
      role: isFirstUser ? 'admin' : 'user',
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);

      return res.status(400).json({
        message: messages.join(', '),
      });
    }

    console.error('[Auth] Register Error:', err);

    res.status(500).json({
      message: 'Registration failed',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        message: 'Account is inactive. Contact administrator.',
      });
    }

    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    await log({
      userId: user._id,
      action: 'login',
      detail: `Logged in from ${req.ip}`,
      req,
    });

    const token = signToken(user._id);

    res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('[Auth] Login Error:', err);

    res.status(500).json({
      message: 'Login failed',
    });
  }
};

const me = async (req, res) => {
  res.json({
    user: req.user.toSafeObject(),
  });
};

module.exports = {
  register,
  login,
  me,
};