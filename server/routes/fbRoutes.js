// routes/facebookRoutes.js - ROUTES ONLY
import express from "express";
import multer from "multer";
import path from "path";
import { 
  uploadReelToFacebook, 
  uploadVideoToFacebook, 
  uploadImageToFacebook,
  getFacebookPageInfo, 
  uploadTextPostToFacebook 
} from "../controllers/FbuploadControllers.js";

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const uploadVideo = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('video');

const uploadImage = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single('image');


router.get("/getPageInfo", getFacebookPageInfo);
// IMPORTANT: Make sure these route names match your frontend exactly
router.post('/uploadReel', uploadVideo, uploadReelToFacebook);
router.post('/uploadVideo', uploadVideo, uploadVideoToFacebook);
router.post('/uploadImage', uploadImage, uploadImageToFacebook);
router.post('/uploadTextPost', uploadTextPostToFacebook); 

export default router;

