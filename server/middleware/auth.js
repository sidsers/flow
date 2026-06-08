import jwt from "jsonwebtoken";
import User from "../models/User.js";

// This is a "gatekeeper" we put in front of any route that requires login.
// It reads the token from the request, verifies it, and loads the user.
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token." });
    }

    // Header looks like: "Bearer abc123token"
    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request so controllers can use it.
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    next(); // all good — continue to the actual route
  } catch (err) {
    res.status(401).json({ message: "Not authorized, token failed." });
  }
}
