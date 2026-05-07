const express = require("express");
const cors = require("cors");
const webhookRoutes = require("./routes/webhookRoutes");
const billingRoutes = require("./routes/billingRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(webhookRoutes);
app.use(billingRoutes);

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error.response?.data || error.message);
  return res.status(500).json({
    error: "Internal server error"
  });
});

module.exports = app;
