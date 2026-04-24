const express = require("express");
const app = express();
const mockDataRoutes = require("./routes/mockDataRoutes");

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Verified Neighbourhood Community");
});

app.use("/", mockDataRoutes);

module.exports = app;