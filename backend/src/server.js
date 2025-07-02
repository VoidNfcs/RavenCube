import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

// Routes
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";

const app = express();

// === Middleware ===
app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Health Check Route ===
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// === API Routes ===
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// === Start Server ===
const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${ENV.PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};

startServer();
