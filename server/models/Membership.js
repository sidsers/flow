import mongoose from "mongoose";

// A Membership says "this user belongs to this space, with this role."
// A space can have many leads and many members.
const membershipSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["lead", "member"],
      default: "member",
    },
  },
  { timestamps: true }
);

// A person can only have one membership row per space.
membershipSchema.index({ space: 1, user: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
