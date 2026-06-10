import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as data from "../resources.js";

// Org-admin-only panel: see every account and grant/revoke org admin.
// This is how you end up with multiple org admins.
export default function AdminUsersModal({ onClose }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    const list = await data.getUsers();
    setUsers(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAdmin(u) {
    setMsg("");
    const newRole = u.role === "admin" ? "member" : "admin";
    try {
      await data.setUserRole(u._id, newRole);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Couldn't change that.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Org admins</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="auth-sub" style={{ marginBottom: 16 }}>
          Org admins can see every space and manage everything. Toggle the
          button to grant or revoke admin.
        </p>
        {msg && <div className="alert">{msg}</div>}

        {loading ? (
          <p className="comments-empty">Loading…</p>
        ) : (
          <div className="member-list">
            {users.map((u) => (
              <div className="member-row" key={u._id}>
                <div className="member-info">
                  <span className="member-name">
                    {u.name}
                    {u._id === user?.id && " (you)"}
                  </span>
                  <span className="member-email">{u.email}</span>
                </div>
                <div className="member-actions">
                  {u.role === "admin" && (
                    <span className="role-badge admin">org admin</span>
                  )}
                  <button
                    className={u.role === "admin" ? "btn-ghost" : "btn-primary"}
                    style={{ width: "auto", marginTop: 0, padding: "6px 12px" }}
                    onClick={() => toggleAdmin(u)}
                  >
                    {u.role === "admin" ? "Revoke" : "Make admin"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
