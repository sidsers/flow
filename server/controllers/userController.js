import User from "../models/User.js";
import { isAdmin } from "../utils/access.js";

// GET /api/users — list everyone (org admins only).
// Used by the admin screen to see all accounts and promote org admins.
export async function listUsers(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Org admins only." });
    }
    const users = await User.find().select("name email role").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// PUT /api/users/:id/role — make someone an org admin (or remove it).
// Only an existing org admin can do this, which is how you get multiple admins.
export async function setUserRole(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Org admins only." });
    }
    const role = req.body.role === "admin" ? "admin" : "member";

    // Don't let an admin accidentally remove the last admin and lock
    // everyone out.
    if (role === "member") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const target = await User.findById(req.params.id);
      if (target?.role === "admin" && adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "There must be at least one org admin." });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
