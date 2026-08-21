// routes/authRoutes.js
import express from "express";
import { signup, signin } from "../controllers/authController.js";
import { validateAuth } from "../middleware/validator.js";

const router = express.Router();

router.post("/signup", validateAuth, signup);
router.post("/signin", validateAuth, signin);

export default router;
