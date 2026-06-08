import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as data from "../resources.js";

// The four columns and their human labels — shared shape used across the board.
export const STATUSES = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

export const PRIORITIES = ["low", "medium", "high", "urgent"];

// A pop-up form for creating a new issue OR editing an existing one.
// If `issue` is passed in, we're editing; otherwise we're creating.
export default function IssueModal({ issue, users, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);

  const isEditing = Boolean(issue);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setPriority(issue.priority || "medium");
      setStatus(issue.status || "todo");
      setAssignee(issue.assignee?._id || "");
    }
  }, [issue]);

  async function handleSave() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSave({ title, description, priority, status, assignee });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEditing ? `Edit ${issue.label}` : "New issue"}</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail (optional)"
            rows={3}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Assignee</span>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        <div className="modal-foot">
          {isEditing && (
            <button className="btn-danger" onClick={() => onDelete(issue)}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : isEditing ? "Save changes" : "Create issue"}
          </button>
        </div>

        {/* Comments only make sense on an issue that already exists. */}
        {isEditing && <Comments issueId={issue._id} />}
      </div>
    </div>
  );
}

// The comment thread for a single issue.
function Comments({ issueId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    data
      .getComments(issueId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [issueId]);

  async function post() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const created = await data.createComment(issueId, text);
      setComments((prev) => [...prev, created]);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  async function remove(id) {
    await data.deleteComment(id);
    setComments((prev) => prev.filter((c) => c._id !== id));
  }

  function initials(name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  }

  return (
    <div className="comments">
      <div className="comments-head">
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {loading ? (
        <p className="comments-empty">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="comments-empty">No comments yet. Start the conversation.</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div className="comment" key={c._id}>
              <div className="mini-avatar" title={c.author?.name}>
                {c.author ? initials(c.author.name) : "?"}
              </div>
              <div className="comment-body">
                <div className="comment-top">
                  <span className="comment-author">{c.author?.name}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                  {c.author?._id === user?.id && (
                    <button
                      className="comment-del"
                      onClick={() => remove(c._id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="comment-compose">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Write a comment and press Enter…"
        />
        <button className="btn-primary" onClick={post} disabled={posting}>
          {posting ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}
