import express from "express";
import { register, login } from "../controllers/Authcontrollers.js";
import { allowCors } from "../../../cors.js";

export default allowCors(authRoute);

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
