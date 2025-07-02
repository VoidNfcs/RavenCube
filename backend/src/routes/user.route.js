import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller..js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/profile/:username", getUserProfile);

// Protected routes
router.use(protectRoute);

router.post("/sync", syncUser);
router.post("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.post("/follow/:targetUserId", followUser);

export default router;
