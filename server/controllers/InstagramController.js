// ========================================
// controllers/InstagramController.js - CONTROLLER ONLY
// ========================================

import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const unlinkFile = promisify(fs.unlink);

// Upload file to your own server's public directory
const uploadToPublicStorage = async (filePath) => {
  try {
    console.log("📤 Creating public URL for:", filePath);
    
    // Create public uploads directory if it doesn't exist
    const publicDir = 'public/uploads';
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log("📁 Created public/uploads directory"); 
    }
    
    // Copy file to public directory with unique name
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(filePath)}`;
    const publicPath = path.join(publicDir, fileName);
    
    fs.copyFileSync(filePath, publicPath);
    
    // Your server's public URL
    const baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:30000';
    const publicUrl = `${baseUrl}/uploads/${fileName}`;
    
    console.log("✅ Public URL created:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Failed to create public URL:", error);
    throw new Error("Failed to create public URL");
  }
};

// Get Instagram Business Account config
export const getInstagramConfig = async (userId) => {
  try {
    console.log("Getting Instagram config for userId:", userId);
    const user = await User.findById(userId);
    console.log("User found:", !!user);
    
    if (!user || !user.meta?.instagram?.length) {
      console.error("No Instagram config found in DB for user:", userId);
      throw new Error("No Instagram config found in DB");
    }
    
    const instagram = user.meta.instagram.find((ig) => ig.accessToken && ig.igId);
    if (!instagram) {
      console.error("No valid Instagram account found in DB. Accounts:", user.meta.instagram);
      throw new Error("No valid Instagram account found in DB");
    }
    
    console.log("Instagram config found:", { igId: instagram.igId, hasToken: !!instagram.accessToken });
    return { accessToken: instagram.accessToken, instagramBusinessId: instagram.igId };
  } catch (error) {
    console.error("Error in getInstagramConfig:", error);
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
  let ext = path.extname(file.originalname) || (file.mimetype.startsWith('image/') ? ".jpg" : ".mp4");
  
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
  }
};

// Upload TEXT POST to Instagram - Enhanced debugging
export const uploadTextPostToInstagram = async (req, res) => {
  try {
    console.log("=== INSTAGRAM TEXT POST START ===");
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
      return res.status(400).json({ success: false, error: "Caption is required for Instagram text posts" });
    }

    console.log("Getting Instagram config...");
    const { accessToken, instagramBusinessId } = await getInstagramConfig(userId);
    console.log("✅ Instagram config retrieved:", { instagramBusinessId, hasToken: !!accessToken });

    // Instagram doesn't support pure text posts like Facebook
    console.log("❌ Instagram doesn't support pure text posts");
    return res.status(400).json({ 
      success: false, 
      error: "Instagram doesn't support pure text posts. Please include an image or video.",
      suggestion: "Use uploadImageToInstagram with a caption instead"
    });

  } catch (err) {
    console.error("=== INSTAGRAM TEXT POST ERROR ===");
    console.error("Error type:", err.name);
    console.error("Error message:", err.message);
    console.error("Error response status:", err.response?.status);
    console.error("Error response data:", err.response?.data);
    console.error("Full error:", err);
    
    const errorMessage = err.response?.data?.error?.message || 
                        err.response?.data?.message || 
                        err.message || 
                        "Failed to post text";
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: {
        type: err.name,
        status: err.response?.status,
        igError: err.response?.data,
        originalError: err.message
      }
    });
  }
};

// Upload Instagram REEL - Using public URL approach
export const uploadReelToInstagram = async (req, res) => {
  let filePath = null;
  
  try {
    console.log("=== INSTAGRAM REEL UPLOAD START ===");
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

    const { accessToken, instagramBusinessId } = await getInstagramConfig(userId);
    filePath = prepareFilePath(videoFile);

    // STEP 1: Upload video to public storage
    console.log("📤 Creating public URL for reel video...");
    const publicVideoUrl = await uploadToPublicStorage(filePath);

    // STEP 2: Create reel media container
    console.log("📱 Creating Instagram reel media container...");
    const mediaPayload = {
      video_url: publicVideoUrl,
      caption: caption || "",
      media_type: "REELS",
      access_token: accessToken
    };
    
    const url = `https://graph.facebook.com/v19.0/${instagramBusinessId}/media`;
    console.log("Posting to Instagram API:", url);

    const mediaResponse = await axios.post(url, mediaPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    const creationId = mediaResponse.data.id;
    console.log("✅ Reel media container created:", creationId);

    // STEP 3: Wait for processing
    console.log("⏳ Waiting for reel processing...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // STEP 4: Publish
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramBusinessId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      },
      { timeout: 30000 }
    );

    console.log("✅ Reel upload response:", publishResponse.data);
    await cleanupFile(filePath);
    
    res.status(200).json({ success: true, data: publishResponse.data });

  } catch (err) {
    console.error("=== INSTAGRAM REEL UPLOAD ERROR ===");
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
        igError: err.response?.data,
        possibleCauses: [
          "Video format not supported for reels (use MP4)",
          "Video too long (reels max ~90 seconds)", 
          "Instagram Business account doesn't have reel publishing permissions",
          "Video aspect ratio not suitable (vertical preferred)",
          "Access token missing required permissions"
        ]
      }
    });
  }
};

// Upload normal VIDEO to Instagram
export const uploadVideoToInstagram = async (req, res) => {
  let filePath = null;
  
  try {
    console.log("=== INSTAGRAM VIDEO UPLOAD START ===");
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
      return res.status(400).json({ success: false, error: "Video file is required" });
    }

    if (!videoFile.mimetype.startsWith('video/')) {
      return res.status(400).json({ success: false, error: "File must be a video" });
    }

    const { accessToken, instagramBusinessId } = await getInstagramConfig(userId);
    filePath = prepareFilePath(videoFile);

    // STEP 1: Upload video to public storage
    console.log("📤 Creating public URL for video...");
    const publicVideoUrl = await uploadToPublicStorage(filePath);

    // STEP 2: Create media container using video_url
    console.log("📝 Creating Instagram video media container...");
    const mediaPayload = {
      video_url: publicVideoUrl,
      caption: caption || "",
      access_token: accessToken
    };

    const url = `https://graph.facebook.com/v19.0/${instagramBusinessId}/media`;
    console.log("Posting to Instagram API:", url);

    const mediaResponse = await axios.post(url, mediaPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    const creationId = mediaResponse.data.id;
    console.log("✅ Video media container created:", creationId);

    // STEP 3: Wait for video processing
    console.log("⏳ Waiting for video processing...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // STEP 4: Publish
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramBusinessId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      },
      { timeout: 30000 }
    );

    console.log("✅ Instagram video upload response:", publishResponse.data);
    await cleanupFile(filePath);
    
    res.status(200).json({ success: true, data: publishResponse.data });

  } catch (err) {
    console.error("=== INSTAGRAM VIDEO UPLOAD ERROR ===");
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

// Upload IMAGE to Instagram
export const uploadImageToInstagram = async (req, res) => {
  let filePath = null;
  
  try {
    console.log("=== INSTAGRAM IMAGE UPLOAD START ===");
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
      return res.status(400).json({ success: false, error: "Image file is required" });
    }

    if (!imageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: "File must be an image" });
    }

    const { accessToken, instagramBusinessId } = await getInstagramConfig(userId);
    filePath = prepareFilePath(imageFile);

    // STEP 1: Upload image to public storage to get URL
    console.log("📤 Creating public URL for image...");
    const publicImageUrl = await uploadToPublicStorage(filePath);

    // STEP 2: Create media container using image_url
    console.log("📝 Creating Instagram media container with image_url...");
    const mediaPayload = {
      image_url: publicImageUrl,
      caption: caption || "",
      access_token: accessToken
    };

    const url = `https://graph.facebook.com/v19.0/${instagramBusinessId}/media`;
    console.log("Posting to Instagram API:", url);
    console.log("Payload:", { ...mediaPayload, access_token: "[HIDDEN]" });

    const mediaResponse = await axios.post(url, mediaPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const creationId = mediaResponse.data.id;
    console.log("✅ Image media container created:", creationId);

    // STEP 3: Brief wait for image processing
    console.log("⏳ Brief wait for image processing...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // STEP 4: Publish the media
    console.log("📢 Publishing media...");
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramBusinessId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      },
      { timeout: 30000 }
    );

    console.log("✅ Instagram API response:", publishResponse.data);
    await cleanupFile(filePath);
    
    res.status(200).json({ success: true, data: publishResponse.data });

  } catch (err) {
    console.error("=== INSTAGRAM IMAGE UPLOAD ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error response status:", err.response?.status);
    console.error("Error response data:", err.response?.data);
    
    if (filePath) await cleanupFile(filePath);
    
    const errorMessage = err.response?.data?.error?.message || 
                        err.response?.data?.message || 
                        err.message || 
                        "Unknown error occurred";
    
    res.status(200).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        responseData: err.response?.data,
        status: err.response?.status
      } : undefined
    });
  }
};

// Get Instagram account information
export const getAccountInfo = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    const { instagramBusinessId, accessToken } = await getInstagramConfig(userId);

    console.log("📊 Fetching Instagram account info...");
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${instagramBusinessId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`,
      { timeout: 10000 }
    );

    console.log("✅ Account info retrieved successfully");
    res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error("❌ Error fetching account info:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.response?.data?.error?.message || "Failed to fetch Instagram account information"
    });
  }
};


