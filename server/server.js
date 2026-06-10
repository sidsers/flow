import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";

// Load the secret values from the .env file.
dotenv.config();

// Connect to the database.
connectDB();

const app = express();

// Allow the React frontend to talk to this server.
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// Let the server understand JSON sent from the frontend.
// The higher limit leaves room for image attachments (sent as data URLs).
app.use(express.json({ limit: "6mb" }));

// A simple health-check you can hit to confirm the API is alive.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Jira clone API is running 🚀" });
});

// All the API routes.
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/attachments", attachmentRoutes);

// ---- Serve the built React app (production) ----
// When deployed, the frontend is built into client/dist. If that folder
// exists, this same server hands out those files — so the whole app lives
// at one URL with no separate frontend host needed.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "..", "client", "dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Any route that isn't an API call returns the React app, so refreshing
  // on /login or any page still works.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
