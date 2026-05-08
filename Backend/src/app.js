import authRoutes from './routes/authRoutes.js';
import mockDataRoutes from "./routes/mockDataRoutes.js";
import supabaseNeighborhoodsRoutes from "./routes/supabaseNeighborhoodsRoutes.js";
import supabaseProposalsRoutes from "./routes/supabaseProposalsRoutes.js";
import supabaseProviderApplicationsRoutes from "./routes/supabaseProviderApplicationsRoutes.js";
import supabaseServiceRequestsRoutes from "./routes/supabaseServiceRequestsRoutes.js";
import supabaseServicesRoutes from "./routes/supabaseServicesRoutes.js";
import supabaseReviewsRoutes from "./routes/supabaseReviewsRoutes.js";

import supabaseEventsRoutes from "./routes/supabaseEventsRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import express from 'express'
import cors from 'cors'
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
app.use("/", supabaseProviderApplicationsRoutes);
app.use("/", supabaseServiceRequestsRoutes);
app.use("/", supabaseServicesRoutes);
app.use("/", supabaseReviewsRoutes);

app.use("/", supabaseEventsRoutes);
app.use("/", marketplaceRoutes);
app.use("/", alertRoutes);
app.use("/", postRoutes);
app.use("/", notificationRoutes);
app.use("/messages", messageRoutes);

// Mock data routes (for other features)
app.use("/", mockDataRoutes);

export default app;