const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectdb=require("./config/db")
dotenv.config();
const PORT = process.env.PORT || 3000;
const session = require("express-session");
const app = express();
const crypto = require("crypto");
app.use(
  session({
    secret: crypto.randomBytes(64).toString("hex"), // Use a strong, unique secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");

// Use routes
app.use("/auth", authRoutes);

// MongoDB connection
connectdb()

// Start server
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
