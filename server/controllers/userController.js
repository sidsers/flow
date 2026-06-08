import User from "../models/User.js";

// GET /api/users — list everyone (used to fill the "assign to" dropdown)
export async function listUsers(req, res) {
  try {
    const users = await User.find().select("name email role").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
