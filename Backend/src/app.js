require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const mockDataRoutes = require('./routes/mockDataRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Verified Neighbourhood Community');
});

// ── Auth & Profile routes (REQ-1 to REQ-13) ──────────────────────────────────
app.use('/auth', authRoutes);

// ── User lookup for inter-module use ─────────────────────────────────────────
app.use('/api/users', userRoutes);

// ── Mock data routes (existing, untouched) ───────────────────────────────────
app.use('/', mockDataRoutes);

module.exports = app;
