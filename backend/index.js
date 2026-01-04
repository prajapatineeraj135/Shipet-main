// shipet-backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();



// Middlewares
const allowedOrigins = [
  "http://localhost:3000",
  "https://shipet-main.vercel.app",
  "https://lightcyan-yak-679712.hostingersite.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Connect MongoDB
mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Test Route
app.get("/", (req, res) => {
    res.send("Backend Running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend working ✅" });
});


//Route
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/pickup-address", require("./routes/pickupAddressRoutes"));
app.use("/api/pincode", require("./routes/pincodeRoutes"));
app.use("/api/shipment-estimate", require("./routes/shipmentCostEstimateRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/ndr', require('./routes/ndrRoutes'));
app.use('/api/helpdesk', require('./routes/helpdeskRoutes'));
app.use('/api/cod-remittance', require('./routes/codRemittanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/customer-support', require('./routes/supportRoutes'));


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
