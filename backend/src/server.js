import exprress from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

// Database connection
connectDB();

const app = exprress();

app.use(exprress.json());
app.use(exprress.urlencoded({ extended: true }));

app.use("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(ENV.PORT, () => {
  console.log("Server running", ENV.PORT, "in", ENV.NODE_ENV, "mode");
});
