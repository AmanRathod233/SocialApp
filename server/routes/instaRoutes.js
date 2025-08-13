import express from "express";
import multer from "multer";
import path from "path";
import { 
  uploadReelToInstagram, 
  uploadVideoToInstagram, 
  uploadImageToInstagram, 
  uploadTextPostToInstagram,
  getAccountInfo 
} from "../controllers/InstagramController.js";

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

// Routes matching your Facebook pattern
router.post('/uploadReel', uploadVideo, uploadReelToInstagram);
router.post('/uploadVideo', uploadVideo, uploadVideoToInstagram);
router.post('/uploadImage', uploadImage, uploadImageToInstagram);
router.post('/uploadTextPost', uploadTextPostToInstagram); 
router.get('/getAccountInfo', getAccountInfo);

export default router;