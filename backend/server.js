const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const cropRoutes = require('./routes/cropRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const marketRoutes = require('./routes/marketRoutes');
const nearbyRoutes = require('./routes/nearbyRoutes');

const app = express();

// Render ke proxy ke peeche asli user ka IP padhne ke liye
app.set('trust proxy', 1);

// FRONTEND_URL mein frontend ka link rakhte hain (comma se alag karke kai bhi ho sakte hain)
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/nearby', nearbyRoutes);

app.get('/health', (req, res) => {
  res.send('AgriSathi-AI Backend is running');
});

// Build hui React website (frontend/dist) yahin se dikhate hain
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));

// /api ke alawa koi bhi page (jaise /chat, /crops) par React ka index.html bhejte hain
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err, req, res, next) => {
  console.log('Express Error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err);
});

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.log('MongoDB Connection Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});