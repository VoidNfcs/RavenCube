const mongoose = await import("mongoose");
const { ENV } = await import("./env.js");

export const connectDB = async () => {
  try {
    const connect = await mongoose.connect(ENV.MONGO_URI);
    console.log("MongoDB connected:", connect.connection.host);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
