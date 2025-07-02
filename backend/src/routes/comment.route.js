import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";

const router = express.Router();

// Public routes
router.get("/post/:postId", getComments);

// Protected routes
router.use(protectRoute);
router.post("/post/:postId", createComment);
router.delete("/:commentId", deleteComment);

export default router;
