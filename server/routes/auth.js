const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register — Step 1: Validate, save pending data, send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate and store OTP (delete any previous OTPs for this email)
    await Otp.deleteMany({ email });
    const otp = generateOTP();
    await new Otp({ email, otp }).save();

    // Send OTP email
    await sendOtpEmail(email, otp, name);

    // Hash password and send it back — client will resend during verify
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    res.status(200).json({
      message: 'OTP sent to your email',
      pendingUser: { name, email, hashedPassword },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp — Step 2: Verify OTP and create user
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, hashedPassword } = req.body;

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — create the user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// POST /api/auth/resend-otp — Resend a new OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Delete old OTPs and generate new one
    await Otp.deleteMany({ email });
    const otp = generateOTP();
    await new Otp({ email, otp }).save();

    await sendOtpEmail(email, otp, name || 'User');

    res.status(200).json({ message: 'New OTP sent successfully' });
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/account — permanently delete user + all their data
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete all documents belonging to this user
    await Document.deleteMany({ userId });
    // Delete any pending OTPs
    const user = await User.findById(userId);
    if (user) await Otp.deleteMany({ email: user.email });
    // Delete the user
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = router;
