import express from "express";
import mockDataRoutes from "./routes/mockDataRoutes.js";
import supabaseNeighborhoodsRoutes from "./routes/supabaseNeighborhoodsRoutes.js";
import supabaseProposalsRoutes from "./routes/supabaseProposalsRoutes.js";
import supabaseProviderApplicationsRoutes from "./routes/supabaseProviderApplicationsRoutes.js";
import supabaseServiceRequestsRoutes from "./routes/supabaseServiceRequestsRoutes.js";
import supabaseServicesRoutes from "./routes/supabaseServicesRoutes.js";
import supabasePostsRoutes from "./routes/supabasePostsRoutes.js";
import supabaseMarketplaceRoutes from "./routes/supabaseMarketplaceRoutes.js";
import supabaseEventsRoutes from "./routes/supabaseEventsRoutes.js";
import supabaseAlertsRoutes from "./routes/supabaseAlertsRoutes.js";
import supabaseMessagesRoutes from "./routes/supabaseMessagesRoutes.js";
import supabaseUsersRoutes from "./routes/supabaseUsersRoutes.js";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,x-user-id");
  next();
});

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
app.use("/", supabasePostsRoutes);
app.use("/", supabaseMarketplaceRoutes);
app.use("/", supabaseEventsRoutes);
app.use("/", supabaseAlertsRoutes);
app.use("/", supabaseMessagesRoutes);
app.use("/", supabaseUsersRoutes);

// Mock data routes (for other features)
app.use("/", mockDataRoutes);

export default app;