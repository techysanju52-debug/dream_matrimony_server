const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const PendingVisitor = require('../models/PendingVisitor');
const Admin = require('../models/Admin');
const { sendOTP } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Route to handle registration and send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user already exists in active visitors or admins
    const existingVisitor = await Visitor.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingVisitor || existingAdmin) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const otp = generateOTP();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upsert to pending visitor
    await PendingVisitor.findOneAndUpdate(
      { email },
      { name, email, phone, password: hashedPassword, otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send email
    await sendOTP(email, otp, name);

    res.status(200).json({ message: 'OTP sent successfully to email.', email });
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ message: 'Server error during OTP generation.' });
  }
});

// Route to verify OTP and finalize registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingVisitor = await PendingVisitor.findOne({ email });

    if (!pendingVisitor) {
      return res.status(400).json({ message: 'No pending registration found or OTP expired.' });
    }

    if (pendingVisitor.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is valid, create actual Visitor
    const newVisitor = new Visitor({
      name: pendingVisitor.name,
      email: pendingVisitor.email,
      phone: pendingVisitor.phone,
      password: pendingVisitor.password
    });

    await newVisitor.save();

    // Remove from pending
    await PendingVisitor.deleteOne({ email });

    // Don't send password back
    const visitorObj = newVisitor.toObject();
    delete visitorObj.password;

    res.status(201).json({ message: 'Registration successful!', user: visitorObj });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
});

// Route to login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log( email , " " , password)

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user (could be Admin or Visitor)
    let user = await Admin.findOne({ email });
    let role = 'admin';

    if (!user) {
      user = await Visitor.findOne({ email });
      role = 'visitor';
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Set HTTPOnly cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Don't send password back
        const userObj = user.toObject();
        delete userObj.password;
        userObj.role = role; // Ensure role is explicitly set
        
        res.json({ user: userObj, message: 'Logged in successfully' });
      }
    );

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Route to get current logged in user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let user = await Admin.findById(req.user.id).select('-password');
    let role = 'admin';

    if (!user) {
      user = await Visitor.findById(req.user.id).select('-password');
      role = 'visitor';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.role = role;
    
    res.json(userObj);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
