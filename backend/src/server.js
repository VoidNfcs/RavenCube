import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

// Routes
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());
app.use(arcjetMiddleware);

// === Health Check Route ===
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// === API Routes ===
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// === Start Server ===
const startServer = async () => {
  try {
    await connectDB();

    if (ENV.NODE_ENV === "development") {
      app.listen(ENV.PORT, () => {
        console.log(
          `🚀 Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`
        );
      });
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};

startServer();

export default app;
