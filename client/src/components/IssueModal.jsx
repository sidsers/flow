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
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isEditing = Boolean(issue);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setPriority(issue.priority || "medium");
      setStatus(issue.status || "todo");
      setAssignee(issue.assignee?._id || "");
      setStartDate(issue.startDate ? issue.startDate.slice(0, 10) : "");
      setDueDate(issue.dueDate ? issue.dueDate.slice(0, 10) : "");
    }
  }, [issue]);

  async function handleSave() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const payload = { title, description, priority, status, assignee };
      if (isAdmin) {
        payload.startDate = startDate || null;
        payload.dueDate = dueDate || null;
      }
      await onSave(payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEditing ? `Edit ${issue.label}` : "New task"}</h2>
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

        {isAdmin && (
          <div className="field-row">
            <label className="field">
              <span>Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>
        )}

        {!isAdmin && (issue?.startDate || issue?.dueDate) && (
          <div className="field-row">
            {issue.startDate && (
              <label className="field">
                <span>Start date</span>
                <input type="date" value={issue.startDate.slice(0, 10)} disabled />
              </label>
            )}
            {issue.dueDate && (
              <label className="field">
                <span>Due date</span>
                <input type="date" value={issue.dueDate.slice(0, 10)} disabled />
              </label>
            )}
          </div>
        )}

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
            {busy ? "Saving…" : isEditing ? "Save changes" : "Create task"}
          </button>
        </div>

        {/* Images and comments only make sense on a task that exists. */}
        {isEditing && <Attachments issueId={issue._id} />}
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

// Image attachments for a task: upload, preview as thumbnails, view full,
// and delete your own.
function Attachments({ issueId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // a dataUrl to show full-size

  // Cap the original file at ~2.5MB so it stays under the server limit
  // once encoded.
  const MAX_BYTES = 2.5 * 1024 * 1024;

  useEffect(() => {
    data
      .getAttachments(issueId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [issueId]);

  function onPick(e) {
    setError("");
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is too large (max ~2.5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try {
        const created = await data.createAttachment(
          issueId,
          reader.result,
          file.name
        );
        setItems((prev) => [...prev, created]);
      } catch (err) {
        setError(err.response?.data?.message || "Upload failed.");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function remove(id) {
    await data.deleteAttachment(id);
    setItems((prev) => prev.filter((a) => a._id !== id));
  }

  return (
    <div className="attachments">
      <div className="comments-head">
        Images {items.length > 0 && `(${items.length})`}
      </div>

      {error && <div className="alert">{error}</div>}

      {!loading && (
        <div className="thumb-grid">
          {items.map((a) => (
            <div className="thumb" key={a._id}>
              <img
                src={a.dataUrl}
                alt={a.filename}
                onClick={() => setPreview(a.dataUrl)}
              />
              {a.uploadedBy?._id === user?.id && (
                <button
                  className="thumb-del"
                  title="Delete image"
                  onClick={() => remove(a._id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <label className="thumb-add">
            {busy ? "Uploading…" : "+ Add image"}
            <input
              type="file"
              accept="image/*"
              onChange={onPick}
              disabled={busy}
              hidden
            />
          </label>
        </div>
      )}

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt="full size" />
        </div>
      )}
    </div>
  );
}
