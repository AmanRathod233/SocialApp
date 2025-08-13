// routes/metaRoute.js
import express from "express";
import {
    metaAuthCallback,
  metaLoginRedirect,
} from "../controllers/Metacontrollers.js";



const router = express.Router();

router.get("/callback", metaAuthCallback);
router.get("/auth", metaLoginRedirect);

export default router;
