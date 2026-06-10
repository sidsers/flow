import mongoose from "mongoose";

// An Invite records that an email was invited into a space with a role.
// If the person already has an account they're added immediately and no
// invite is stored. If they don't, the invite waits here until they
// register with that email — then they're auto-joined.
const inviteSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["lead", "member"],
      default: "member",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invite", inviteSchema);
