import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { resolveInvites } from "../utils/invites.js";

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
    role: user.role, // "admin" (org admin) or "member"
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

    // The very first person to register becomes the org admin so there's
    // always someone who can set up spaces. (More admins can be added later.)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "member";

    const user = await User.create({ name, email, password, role });

    // Apply any invites that were waiting for this email address.
    await resolveInvites(user);

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

    // Pick up any invites added since they last signed in.
    await resolveInvites(user);

    const token = createToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// GET /api/auth/me  — return the currently logged-in user
// (req.user is set by the auth middleware)
export async function getMe(req, res) {
  // Resolve invites here too, so a logged-in person who just got invited
  // gains access on their next page refresh without re-logging in.
  await resolveInvites(req.user);
  res.json({ user: publicUser(req.user) });
}
