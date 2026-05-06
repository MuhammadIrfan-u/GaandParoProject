import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import mockDataRoutes from "./routes/mockDataRoutes.js";
import supabaseNeighborhoodsRoutes from "./routes/supabaseNeighborhoodsRoutes.js";
import supabaseProposalsRoutes from "./routes/supabaseProposalsRoutes.js";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,x-user-id");
  next();
});



app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Verified Neighbourhood Community - Supabase Edition");
});

// Supabase routes (neighborhoods and proposals) - MUST BE BEFORE MOCK DATA ROUTES
app.use("/", supabaseNeighborhoodsRoutes);
app.use("/", supabaseProposalsRoutes);

// Mock data routes (for other features)
app.use("/", mockDataRoutes);

export default app;