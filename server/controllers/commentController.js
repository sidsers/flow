import Comment from "../models/Comment.js";

// GET /api/comments?issue=ISSUE_ID — list comments on one issue
export async function listComments(req, res) {
  try {
    const { issue } = req.query;
    if (!issue) {
      return res.status(400).json({ message: "An issue id is required." });
    }
    const comments = await Comment.find({ issue })
      .populate("author", "name email")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/comments — add a comment to an issue
export async function createComment(req, res) {
  try {
    const { issue, text } = req.body;
    if (!issue || !text || !text.trim()) {
      return res.status(400).json({ message: "Issue and text are required." });
    }

    const comment = await Comment.create({
      issue,
      text: text.trim(),
      author: req.user._id,
    });

    const populated = await Comment.findById(comment._id).populate(
      "author",
      "name email"
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/comments/:id — delete a comment (only the author may do this)
export async function deleteComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Only the person who wrote it can delete it.
    if (String(comment.author) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments." });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
