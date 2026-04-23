const express = require("express");
const app = express();

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Verified Neighbourhood Community");
});

module.exports = app;