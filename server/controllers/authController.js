import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Creates a signed login token that proves who the user is.
// The frontend stores this and sends it with every request.
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token is valid for 7 days
  });
}

// Strips the password out before sending a user back to the frontend.
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register  — create a new account
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "That email is already registered." });
    }

    const user = await User.create({ name, email, password });
    const token = createToken(user._id);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/auth/login  — sign in to an existing account
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// GET /api/auth/me  — return the currently logged-in user
// (req.user is set by the auth middleware)
export async function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}
