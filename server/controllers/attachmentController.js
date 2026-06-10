import Attachment from "../models/Attachment.js";
import { canAccessIssue } from "../utils/access.js";

// Roughly 4MB once base64-encoded (data URL length is ~4/3 of file bytes).
const MAX_DATAURL_LENGTH = 4 * 1024 * 1024;

// GET /api/attachments?issue=ISSUE_ID — list a task's images.
// We don't send the heavy dataUrl in the list to keep it light; the
// thumbnails are fetched, but here we include them so they render inline.
export async function listAttachments(req, res) {
  try {
    const { issue } = req.query;
    if (!issue) {
      return res.status(400).json({ message: "An issue id is required." });
    }
    if (!(await canAccessIssue(req.user, issue))) {
      return res.status(403).json({ message: "You don't have access to this task." });
    }
    const attachments = await Attachment.find({ issue })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: 1 });
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/attachments — add an image to a task.
export async function createAttachment(req, res) {
  try {
    const { issue, dataUrl, filename } = req.body;
    if (!issue || !dataUrl) {
      return res.status(400).json({ message: "Issue and image are required." });
    }
    if (!dataUrl.startsWith("data:image/")) {
      return res.status(400).json({ message: "Only image files are allowed." });
    }
    if (dataUrl.length > MAX_DATAURL_LENGTH) {
      return res
        .status(400)
        .json({ message: "That image is too large (max ~3MB)." });
    }
    if (!(await canAccessIssue(req.user, issue))) {
      return res.status(403).json({ message: "You don't have access to this task." });
    }

    const attachment = await Attachment.create({
      issue,
      dataUrl,
      filename: filename || "image",
      uploadedBy: req.user._id,
    });

    const populated = await Attachment.findById(attachment._id).populate(
      "uploadedBy",
      "name email"
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/attachments/:id — remove an image (only the uploader).
export async function deleteAttachment(req, res) {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found." });
    }
    if (String(attachment.uploadedBy) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete images you uploaded." });
    }
    await attachment.deleteOne();
    res.json({ message: "Attachment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
