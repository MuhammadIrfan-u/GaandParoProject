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
import membershipRoutes from "./routes/membershipRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import fraudRoutes from "./routes/fraud.routes.js";
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', membershipRoutes);
app.use('/api', verificationRoutes);

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
app.use("/api/fraud/check", fraudRoutes);

// Mock data routes (for other features)
app.use("/", mockDataRoutes);

export default app;