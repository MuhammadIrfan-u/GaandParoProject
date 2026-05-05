import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import mockDataRoutes from './routes/mockDataRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supabaseNeighborhoodsRoutes from './routes/supabaseNeighborhoodsRoutes.js';
import supabaseProposalsRoutes from './routes/supabaseProposalsRoutes.js';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// MongoDB connection (for Auth & Profile module)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Verified Neighbourhood Community');
});

// ── Auth & Profile routes (User Authentication module) ────────────────────────
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);

// ── Supabase routes (Neighborhood Creation module) ────────────────────────────
app.use('/', supabaseNeighborhoodsRoutes);
app.use('/', supabaseProposalsRoutes);

// ── Mock data routes ──────────────────────────────────────────────────────────
app.use('/', mockDataRoutes);

export default app;
