const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const requireLogin = require('../middleware/auth');

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, dob, gender } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      gender
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN  (NEW)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user._id;
    res.status(200).json({ message: 'Login successful', name: user.name });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET current logged-in user's profile
router.get('/me', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE current logged-in user's profile
router.put('/me', requireLogin, async (req, res) => {
  try {
    const { name, dob, gender } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { name, dob, gender },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE current logged-in user's account
router.delete('/me', requireLogin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.session.userId);
    req.session.destroy();
    res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;