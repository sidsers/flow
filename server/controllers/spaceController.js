import Space from "../models/Space.js";
import Membership from "../models/Membership.js";
import Invite from "../models/Invite.js";
import User from "../models/User.js";
import {
  isAdmin,
  canAccessSpace,
  canManageSpace,
} from "../utils/access.js";

// GET /api/spaces — list the spaces this user can see, with their role.
export async function listSpaces(req, res) {
  try {
    if (isAdmin(req.user)) {
      // Admins see every space.
      const spaces = await Space.find().sort({ createdAt: 1 });
      return res.json(
        spaces.map((s) => ({
          _id: s._id,
          name: s.name,
          description: s.description,
          myRole: "admin",
        }))
      );
    }

    // Everyone else sees only the spaces they belong to.
    const memberships = await Membership.find({ user: req.user._id }).populate(
      "space"
    );
    const spaces = memberships
      .filter((m) => m.space) // guard against a deleted space
      .map((m) => ({
        _id: m.space._id,
        name: m.space.name,
        description: m.space.description,
        myRole: m.role, // "lead" or "member"
      }));
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/spaces — create a space (org admins only).
export async function createSpace(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only an org admin can create spaces." });
    }
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "A space name is required." });
    }

    const space = await Space.create({
      name: name.trim(),
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json({
      _id: space._id,
      name: space.name,
      description: space.description,
      myRole: "admin",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// GET /api/spaces/:id/members — list members + pending invites of a space.
export async function listMembers(req, res) {
  try {
    if (!(await canAccessSpace(req.user, req.params.id))) {
      return res.status(403).json({ message: "You don't have access to this space." });
    }
    const memberships = await Membership.find({ space: req.params.id })
      .populate("user", "name email role")
      .sort({ createdAt: 1 });

    const members = memberships
      .filter((m) => m.user)
      .map((m) => ({
        membershipId: m._id,
        user: m.user,
        role: m.role,
      }));

    const invites = await Invite.find({
      space: req.params.id,
      status: "pending",
    }).sort({ createdAt: 1 });

    res.json({
      members,
      invites: invites.map((i) => ({ _id: i._id, email: i.email, role: i.role })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/spaces/:id/invite — invite someone by email (admins & leads).
export async function inviteToSpace(req, res) {
  try {
    if (!(await canManageSpace(req.user, req.params.id))) {
      return res
        .status(403)
        .json({ message: "Only a lead or org admin can invite people." });
    }

    const { email, role } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanRole = role === "lead" ? "lead" : "member";

    if (!cleanEmail) {
      return res.status(400).json({ message: "An email is required." });
    }

    // If the person already has an account, add them right away.
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const existingMembership = await Membership.findOne({
        space: req.params.id,
        user: existingUser._id,
      });
      if (existingMembership) {
        existingMembership.role = cleanRole;
        await existingMembership.save();
      } else {
        await Membership.create({
          space: req.params.id,
          user: existingUser._id,
          role: cleanRole,
        });
      }
      return res.json({ added: true, email: cleanEmail });
    }

    // Otherwise store a pending invite (don't duplicate one).
    const existingInvite = await Invite.findOne({
      space: req.params.id,
      email: cleanEmail,
      status: "pending",
    });
    if (existingInvite) {
      existingInvite.role = cleanRole;
      await existingInvite.save();
    } else {
      await Invite.create({
        space: req.params.id,
        email: cleanEmail,
        role: cleanRole,
        invitedBy: req.user._id,
      });
    }
    res.json({ invited: true, email: cleanEmail });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// PUT /api/spaces/:id/members/:userId — change a member's role (admins & leads).
export async function updateMemberRole(req, res) {
  try {
    if (!(await canManageSpace(req.user, req.params.id))) {
      return res.status(403).json({ message: "Only a lead or org admin can do this." });
    }
    const role = req.body.role === "lead" ? "lead" : "member";
    const membership = await Membership.findOneAndUpdate(
      { space: req.params.id, user: req.params.userId },
      { role },
      { new: true }
    );
    if (!membership) {
      return res.status(404).json({ message: "That person isn't in this space." });
    }
    res.json({ membershipId: membership._id, role: membership.role });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/spaces/:id/members/:userId — remove someone (admins & leads).
export async function removeMember(req, res) {
  try {
    if (!(await canManageSpace(req.user, req.params.id))) {
      return res.status(403).json({ message: "Only a lead or org admin can do this." });
    }
    const removed = await Membership.findOneAndDelete({
      space: req.params.id,
      user: req.params.userId,
    });
    if (!removed) {
      return res.status(404).json({ message: "That person isn't in this space." });
    }
    res.json({ message: "Member removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/spaces/:id/invites/:inviteId — cancel a pending invite.
export async function cancelInvite(req, res) {
  try {
    if (!(await canManageSpace(req.user, req.params.id))) {
      return res.status(403).json({ message: "Only a lead or org admin can do this." });
    }
    await Invite.findOneAndDelete({
      _id: req.params.inviteId,
      space: req.params.id,
    });
    res.json({ message: "Invite cancelled." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
