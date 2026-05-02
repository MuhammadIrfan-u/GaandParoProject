require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const mockDataRoutes = require('./routes/mockDataRoutes');

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

// Mock data routes (existing)
app.use('/', mockDataRoutes);

module.exports = app;
