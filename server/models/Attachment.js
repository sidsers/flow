import mongoose from "mongoose";

// An Attachment is an image attached to a task (issue).
// The image is stored as a "data URL" (the file encoded as text), which
// keeps everything inside the database — no separate file host needed.
const attachmentSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    filename: {
      type: String,
      default: "image",
    },
    // The image itself, e.g. "data:image/png;base64,iVBORw0KG..."
    dataUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);
