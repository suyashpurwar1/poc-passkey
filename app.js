const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectdb=require("./config/db")
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

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
