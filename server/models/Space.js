import mongoose from "mongoose";

// A Space is a self-contained workspace (e.g. one team's area).
// Projects, issues, and comments all live inside a space, and people
// only see the spaces they belong to (org admins see all of them).
const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Space", spaceSchema);
