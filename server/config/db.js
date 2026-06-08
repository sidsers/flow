import mongoose from "mongoose";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// This function opens the connection to your MongoDB database.
// We call it once when the server starts up.
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // If we can't reach the database, there's no point running the server.
    process.exit(1);
  }
}
