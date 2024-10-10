const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtUtils');

// Sign-Up Controller
const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
// LinkedIn Authentication Success
const linkedInAuthSuccess = (req, res) => {
  const token = generateToken(req.user._id);
  console.log('Authenticated User:', req.user); // Log the user object
  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
    },
  });
};
// Protected /me Route - Get Authenticated User Data
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      linkedinId: user.linkedinId,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { signUp, login, linkedInAuthSuccess, getUserProfile };
