import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

// Common population config
const postPopulates = [
  { path: "user", select: "username firstName lastName profilePicture" },
  {
    path: "comments",
    populate: {
      path: "user",
      select: "username firstName lastName profilePicture",
    },
  },
];

// Get all posts
export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate(postPopulates);

  res.status(200).json(posts);
});

// Get single post by ID
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).populate(postPopulates);
  if (!post) return res.status(404).json({ message: "Post not found" });

  res.status(200).json(post);
});

// Get all posts by a specific user
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).select("_id");

  if (!user) return res.status(404).json({ message: "User not found" });

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate(postPopulates);

  res.status(200).json(posts);
});

// Create a new post
export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    return res.status(400).json({ message: "Content or image is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  let imageUrl = "";

  if (imageFile) {
    try {
      const base64Image = `data:${
        imageFile.mimetype
      };base64,${imageFile.buffer.toString("base64")}`;
      const upload = await cloudinary.uploader.upload(base64Image, {
        folder: "RavenCube/posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = upload.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      return res
        .status(500)
        .json({ message: "Image upload failed", error: err });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || "",
    image: imageUrl,
  });

  res.status(201).json({ post });
});

// Like or unlike a post
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ message: "User or Post not found" });
  }

  const isLiked = post.likes.includes(user._id);

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: user._id },
    });
  } else {
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { likes: user._id },
    });

    // Create a notification only if not liking own post
    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked ? "Post unliked" : "Post liked",
  });
});

// Delete a post
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ message: "User or Post not found" });
  }

  if (post.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ message: "You can only delete your own posts" });
  }

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);

  // Delete Cloudinary image
  if (post.image) {
    try {
      const publicId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`RavenCube/posts/${publicId}`);
    } catch (err) {
      console.error("Cloudinary Delete Error:", err);
      return res
        .status(500)
        .json({ message: "Image deletion failed", error: err });
    }
  }

  res.status(200).json({ message: "Post deleted successfully" });
});
