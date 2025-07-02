import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { getAuth } from "@clerk/express";

import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// @desc    Get all comments for a specific post
// @route   GET /api/comments/:postId
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture");

  res.status(200).json({ comments });
});

// @desc    Create a comment on a post
// @route   POST /api/comments/:postId
export const createComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ message: "Comment content cannot be empty" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ message: "User or Post not found" });
  }

  const session = await mongoose.startSession();
  let comment;

  try {
    await session.withTransaction(async () => {
      comment = await Comment.create(
        { user: user._id, post: post._id, content },
        { session }
      );

      await Post.findByIdAndUpdate(
        post._id,
        { $push: { comments: comment._id } },
        { session }
      );
    });

    // Notify post owner if different from commenter
    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "comment",
        post: post._id,
        comment: comment._id,
      });
    }

    res.status(201).json({ comment: comment[0] });
  } catch (error) {
    await session.abortTransaction();
    console.error("Comment creation failed:", error);
    res
      .status(500)
      .json({ message: "Failed to create comment", error: error.message });
  } finally {
    session.endSession();
  }
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
export const deleteComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).populate("user", "clerkId");

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.user.clerkId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only delete your own comments" });
  }

  await Comment.findByIdAndDelete(commentId);
  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  res.status(200).json({ message: "Comment deleted successfully" });
});
