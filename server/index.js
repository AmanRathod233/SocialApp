// server.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";

import authRoutes from "./routes/authRoute.js";
import metaRoutes from "./routes/metaRoute.js";
import instagramRoutes from "./routes/instaRoutes.js";
import facebookRoutes from "./routes/fbRoutes.js"; // ✅ NEW for FB posts

dotenv.config();

const app = express();
const PORT = process.env.PORT || 30000;

// ✅ Middleware
app.use(
  cors({
    origin: "https://social-app-yqn4.vercel.app", // frontend domain only
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // allow cookies/auth headers if needed
  })
);

// Handle preflight requests
app.options("*", cors());
app.use(express.json());


// ✅ Logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/facebook", facebookRoutes); // ✅ NEW

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
