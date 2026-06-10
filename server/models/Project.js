import mongoose from "mongoose";

// A Project is a container for issues — like a single board.
const projectSchema = new mongoose.Schema(
  {
    // Which space this project belongs to.
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // A short code shown on issue cards, e.g. "WEB" -> WEB-1, WEB-2.
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Who created the project.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // A running counter so each issue gets a unique number (WEB-1, WEB-2…).
    issueCounter: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
