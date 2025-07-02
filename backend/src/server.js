import exprress from "express";
import "dotenv/config";

const app = exprress();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running");
});
