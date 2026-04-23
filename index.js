require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');

const app = express();

app.use(cors({
  origin: 'https://dream-matrimony.vercel.app', // Vite default port, adjust if different
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/health', (req, res) => {
  try{
    console.log("Health OK");
  res.status(200).json({ message: 'Server is running' });
  }
  catch(err){
    console.error('Error in health check:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dream_matrimony';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    setInterval(async() => {
        await fetch(`https://dream-matrimony-server.onrender.com/health`,{method:"GET"});
    }, 14 * 60 *1000);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
