import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const unlinkFile = promisify(fs.unlink);


// Get Facebook page config
export const getPageConfig = async (userId) => {
  try {
    console.log("Getting page config for userId:", userId);
    const user = await User.findById(userId);
    console.log("User found:", !!user);

    if (!user || !user.meta?.pages?.length) {
      console.error("No page config found in DB for user:", userId);
      throw new Error("No page config found in DB");
    }

    const page = user.meta.pages.find((p) => p.accessToken && p.id);
    if (!page) {
      console.error("No valid page found in DB. Pages:", user.meta.pages);
      throw new Error("No valid page found in DB");
    }

    console.log("Page config found:", { pageId: page.id, hasToken: !!page.accessToken });
    return { accessToken: page.accessToken, pageId: page.id };
  } catch (error) {
    console.error("Error in getPageConfig:", error);
    throw error;
  }
};

// Extract userId from request
const getUserIdFromReq = (req) => {
  let userId = req.user?._id || req.params?.userId || req.body?.userId;
  console.log("Initial userId from req:", userId);

  if (!userId) {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      console.log("Attempting to extract from token:", !!token);
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded.userId || decoded._id;
        console.log("Decoded userId from token:", userId);
      }
    } catch (tokenError) {
      console.error("JWT decode error:", tokenError.message);
    }
  }

  console.log("Final userId:", userId);
  return userId;
};

// Ensure file path is correct & has extension
const prepareFilePath = (file) => {
  console.log("Preparing file path for:", file.originalname);
  let filePath = file.path;
  let ext = path.extname(file.originalname) || ".mp4"; // default mp4

  if (!filePath.endsWith(ext)) {
    const newPath = filePath + ext;
    console.log("Renaming file from", filePath, "to", newPath);
    fs.renameSync(filePath, newPath);
    filePath = newPath;
  }

  const resolvedPath = path.resolve(filePath);
  console.log("Final file path:", resolvedPath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File does not exist: ${resolvedPath}`);
  }

  return resolvedPath;
};

// Clean up file with better error handling
const cleanupFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await unlinkFile(filePath);
      console.log("File cleaned up:", filePath);
    }
  } catch (cleanupError) {
    console.error("Error cleaning up file:", cleanupError.message);
    // Don't throw here, just log
  }
};



// Upload TEXT POST to Facebook - Enhanced debugging
export const uploadTextPostToFacebook = async (req, res) => {
  try {
    console.log("=== TEXT POST START ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);

    const { caption } = req.body;
    const userId = getUserIdFromReq(req);

    console.log("Extracted data:");
    console.log("- userId:", userId);
    console.log("- caption:", caption);

    if (!userId) {
      console.error("❌ No userId found");
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    if (!caption || caption.trim() === '') {
      console.error("❌ No caption provided");
      return res.status(400).json({ success: false, error: "Caption is required for text posts" });
    }

    console.log("Getting page config...");
    const { accessToken, pageId } = await getPageConfig(userId);
    console.log("✅ Page config retrieved:", { pageId, hasToken: !!accessToken });

    const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const postData = {
      message: caption.trim(),
      access_token: accessToken
    };

    console.log("Posting to Facebook:");
    console.log("- URL:", url);
    console.log("- Data:", { message: postData.message, access_token: "***" });

    const response = await axios.post(url, postData, {
      timeout: 30000
    });

    console.log("✅ Facebook API response:", response.data);
    res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error("=== TEXT POST ERROR ===");
    console.error("Error type:", err.name);
    console.error("Error message:", err.message);
    console.error("Error response status:", err.response?.status);
    console.error("Error response data:", err.response?.data);
    console.error("Full error:", err);

    const errorMessage = err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Failed to post text";

    // Send more specific error info for debugging
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: {
        type: err.name,
        status: err.response?.status,
        fbError: err.response?.data,
        originalError: err.message
      }
    });
  }
};

// Upload Facebook REEL - Simplified approach using standard video API
export const uploadReelToFacebook = async (req, res) => {
  let filePath = null;

  try {
    console.log("=== REEL UPLOAD START ===");
    console.log("File info:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : "❌ No file received");

    const { caption } = req.body;
    const videoFile = req.file;
    const userId = getUserIdFromReq(req);

    if (!userId) {
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    if (!videoFile) {
      return res.status(400).json({ success: false, error: "Video file is required for reels" });
    }

    if (!videoFile.mimetype.startsWith('video/')) {
      return res.status(400).json({ success: false, error: "Reel uploads require video files" });
    }

    const { accessToken, pageId } = await getPageConfig(userId);
    filePath = prepareFilePath(videoFile);

    console.log("Uploading reel using standard video API with reel flag...");
    const form = new FormData();
    form.append("access_token", accessToken);
    form.append("description", caption || "");
    form.append("source", fs.createReadStream(filePath));

    // This tells Facebook to treat it as a reel
    form.append("is_reel", "true");
    // Alternative: use the reel-specific endpoint but with simpler parameters

    const url = `https://graph-video.facebook.com/v19.0/${pageId}/videos`;
    console.log("Posting to Facebook API:", url);

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log("✅ Reel upload response:", response.data);
    await cleanupFile(filePath);

    res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error("=== REEL UPLOAD ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error response data:", err.response?.data);

    if (filePath) await cleanupFile(filePath);

    const errorMessage = err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Failed to upload reel";

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: {
        fbError: err.response?.data,
        possibleCauses: [
          "Video format not supported for reels (use MP4)",
          "Video too long (reels max ~90 seconds)",
          "Page doesn't have reel publishing permissions",
          "Video aspect ratio not suitable (vertical preferred)",
          "Access token missing required permissions"
        ]
      }
    });
  }
};

// Upload normal VIDEO to Facebook
export const uploadVideoToFacebook = async (req, res) => {
  let filePath = null;

  try {
    console.log("=== VIDEO UPLOAD START ===");
    console.log("Request body:", req.body);
    console.log("File info:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : "No file");

    const { caption } = req.body;
    const videoFile = req.file;
    const userId = getUserIdFromReq(req);

    if (!userId) {
      console.error("No userId found in request");
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    if (!videoFile) {
      console.error("No video file in request");
      throw new Error("No video file uploaded");
    }

    const { accessToken, pageId } = await getPageConfig(userId);
    filePath = prepareFilePath(videoFile);

    console.log("Creating FormData for Facebook API...");
    const form = new FormData();
    form.append("access_token", accessToken);
    form.append("description", caption || "");

    const fileStream = fs.createReadStream(filePath);
    form.append("source", fileStream);

    const url = `https://graph-video.facebook.com/v19.0/${pageId}/videos`;
    console.log("Posting to Facebook API:", url);

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 120000 // 2 minute timeout for larger videos
    });

    console.log("Facebook API response:", response.data);
    await cleanupFile(filePath);

    res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error("=== VIDEO UPLOAD ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error response data:", err.response?.data);
    console.error("Error status:", err.response?.status);
    console.error("Full error:", err);

    if (filePath) await cleanupFile(filePath);

    const errorMessage = err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Unknown error occurred";

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        responseData: err.response?.data,
        status: err.response?.status
      } : undefined
    });
  }
};

// Upload IMAGE to Facebook
export const uploadImageToFacebook = async (req, res) => {
  let filePath = null;

  try {
    console.log("=== IMAGE UPLOAD START ===");
    console.log("Request body:", req.body);
    console.log("File info:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : "No file");

    const { caption } = req.body;
    const imageFile = req.file;
    const userId = getUserIdFromReq(req);

    if (!userId) {
      console.error("No userId found in request");
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    if (!imageFile) {
      console.error("No image file in request");
      throw new Error("No image file uploaded");
    }

    const { accessToken, pageId } = await getPageConfig(userId);
    filePath = prepareFilePath(imageFile);

    console.log("Creating FormData for Facebook API...");
    const form = new FormData();
    form.append("access_token", accessToken);
    form.append("caption", caption || "");

    const fileStream = fs.createReadStream(filePath);
    form.append("source", fileStream);

    const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    console.log("Posting to Facebook API:", url);

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 60000 // 60 second timeout
    });

    console.log("Facebook API response:", response.data);
    await cleanupFile(filePath);

    res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error("=== IMAGE UPLOAD ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error response data:", err.response?.data);
    console.error("Error status:", err.response?.status);

    if (filePath) await cleanupFile(filePath);

    const errorMessage = err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Unknown error occurred";

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        responseData: err.response?.data,
        status: err.response?.status
      } : undefined
    });
  }
};