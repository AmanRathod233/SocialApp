import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoute.js";
import metaRoutes from "./routes/metaRoute.js";
import instagramRoutes from "./routes/instaRoutes.js";
import facebookRoutes from "./routes/fbRoutes.js";

dotenv.config();
const app = express();

// ✅ CORS
app.use(cors({
  origin: "https://social-app-yqn4.vercel.app", // your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.options("*", cors());
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/facebook", facebookRoutes);

// ✅ MongoDB connection
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err.message));
}

// ✅ Export for Vercel
export default app;
