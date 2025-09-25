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
import facebookRoutes from "./routes/fbRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 30000;

// ✅ Allowed origins
const allowedOrigins = [
  "https://social-app-yqn4.vercel.app", // deployed frontend
  "http://localhost:3000"                // local dev
];

// ✅ Middleware: CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ Parse JSON
app.use(express.json());

// ✅ Logging middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/facebook", facebookRoutes);

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
