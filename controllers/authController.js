const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const normalizedName = fullname ? fullname.trim() : '';

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const basicSubscription = await Subscription.findOne({ where: { name: 'basic' } });

    const user = await User.create({
      name: normalizedName,
      email,
      password_hash: password,
      subscription_id: basicSubscription ? basicSubscription.id : null
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.name,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Subscription }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.name,
        email: user.email,
        subscription: user.Subscription,
        subscription_expires_at: user.subscription_expires_at,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Subscription }],
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};