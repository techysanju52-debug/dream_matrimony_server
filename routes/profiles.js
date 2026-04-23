const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET
});

const deleteFromCloudinary = async(image_public_id)=>{
    console.log(image_public_id);
    const image_response = await cloudinary.v2.uploader.destroy(image_public_id)
    console.log(image_response);
}

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// GET /api/profiles - Fetch profiles with filters
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    let { gender, minAge, maxAge, religion, occupation, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (gender && gender !== 'All') filter.gender = gender;
    
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }

    if (religion && religion !== 'All') filter.religion = religion;

    if (occupation && occupation !== 'All') {
      filter.occupation = { $regex: occupation, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } },
        { education: { $regex: search, $options: 'i' } },
      ];
    }

    // Unregistered / logged out users can only see 5 profiles max
    if (!req.user) {
      page = 1;
      limit = 5;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // Only admins can see email and phone in list
    const selectFields = req.user && req.user.role === 'admin' ? '' : '-email -phone';

    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .select(selectFields)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Profile.countDocuments(filter),
    ]);

    // If logged out, total is max 5
    const actualTotal = !req.user ? Math.min(total, 5) : total;

    res.json({
      profiles,
      total: actualTotal,
      page: Number(page),
      totalPages: Math.ceil(actualTotal / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Server error fetching profiles.' });
  }
});

// GET /api/profiles/:id - Fetch a single profile by ID
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).lean();
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const isAdmin = req.user && req.user.role === 'admin';

    // Visitors cannot see contact info
    if (!isAdmin) {
      delete profile.email;
      delete profile.phone;
    }

    res.json({ ...profile, showContactInfo: isAdmin });
  } catch (error) {
    console.error('Error fetching profile detail:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Profile ID.' });
    }
    res.status(500).json({ message: 'Server error fetching profile detail.' });
  }
});

// POST /api/profiles - Add a new profile (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { dob, ...rest } = req.body;

    // Calculate age from dob
    let age;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const newProfile = new Profile({ ...rest, dob, age });
    await newProfile.save();
    res.status(201).json({ message: 'Profile added successfully', profile: newProfile });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ message: 'A profile with this email address already exists.' });
    }
    console.error('Error adding profile:', error);
    res.status(500).json({ message: 'Server error adding profile.' });
  }
});

// DELETE /api/profiles/:id - Delete a profile (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    if (!deletedProfile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    if(deletedProfile.profilePictureUrl){
      const public_id = deletedProfile.profilePictureUrl.split('/').slice(-1)[0].replace('.jpg','');
      deleteFromCloudinary(public_id);
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ message: 'Server error deleting profile.' });
  }
});

module.exports = router;
