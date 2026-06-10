import Invite from "../models/Invite.js";
import Membership from "../models/Membership.js";

// When a user registers or logs in, turn any pending invites for their
// email into real space memberships. This is what makes "invite someone
// before they've signed up" work.
export async function resolveInvites(user) {
  const pending = await Invite.find({
    email: user.email.toLowerCase(),
    status: "pending",
  });

  for (const invite of pending) {
    const existing = await Membership.findOne({
      space: invite.space,
      user: user._id,
    });
    if (!existing) {
      await Membership.create({
        space: invite.space,
        user: user._id,
        role: invite.role,
      });
    }
    invite.status = "accepted";
    await invite.save();
  }
}
