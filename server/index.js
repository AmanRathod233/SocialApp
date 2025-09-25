// server.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import metaRoutes from "./routes/metaRoute.js";
import instagramRoutes from "./routes/instaRoutes.js";
import facebookRoutes from "./routes/fbRoutes.js";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: "https://social-app-yqn4.vercel.app", // only your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
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
app.use("/api/facebook", facebookRoutes);

// ✅ MongoDB connection (initialize only once)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));
}

// ✅ Export app for Vercel
export default app;
