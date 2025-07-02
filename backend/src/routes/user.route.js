import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public Routes
router.get("/profile/:username", getUserProfile);

// Protected Routes
router.use(protectRoute);

router.post("/sync", syncUser);
router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);

// Follow/unfollow a user
router.post("/follow/:targetUserId", followUser);

export default router;
