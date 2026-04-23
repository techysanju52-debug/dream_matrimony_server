const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  education: { type: String, required: true },
  religion: { type: String, required: true },
  profilePictureUrl: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // optional but unique when provided
  phone: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: String, required: true },
  description: { type: String, maxLength: 120 }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
