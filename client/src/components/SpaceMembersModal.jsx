import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as data from "../resources.js";

// Manage who's in a space: list members, invite by email, change roles,
// remove people, and see pending invites. Plain members see a read-only
// list; leads and org admins get the management controls.
export default function SpaceMembersModal({ space, onClose }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Can the current user manage this space?
  const canManage = space.myRole === "lead" || space.myRole === "admin";

  async function load() {
    const res = await data.getMembers(space._id);
    setMembers(res.members);
    setInvites(res.invites);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [space._id]);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await data.inviteToSpace(space._id, email.trim(), role);
      setMsg(
        res.added
          ? `${res.email} was added to the space.`
          : `Invite sent to ${res.email}. They'll join when they sign up.`
      );
      setEmail("");
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId, newRole) {
    await data.updateMemberRole(space._id, userId, newRole);
    await load();
  }

  async function remove(userId) {
    await data.removeMember(space._id, userId);
    await load();
  }

  async function cancelInvite(inviteId) {
    await data.cancelInvite(space._id, inviteId);
    await load();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{space.name} · Members</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {canManage && (
          <div className="invite-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              onKeyDown={(e) => e.key === "Enter" && invite()}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="lead">Lead</option>
            </select>
            <button className="btn-primary" onClick={invite} disabled={busy}>
              {busy ? "…" : "Invite"}
            </button>
          </div>
        )}
        {msg && <div className="invite-msg">{msg}</div>}

        {loading ? (
          <p className="comments-empty">Loading…</p>
        ) : (
          <>
            <div className="member-list">
              {members.map((m) => (
                <div className="member-row" key={m.membershipId}>
                  <div className="member-info">
                    <span className="member-name">
                      {m.user.name}
                      {m.user._id === user?.id && " (you)"}
                    </span>
                    <span className="member-email">{m.user.email}</span>
                  </div>
                  {canManage ? (
                    <div className="member-actions">
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.user._id, e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                      </select>
                      <button
                        className="comment-del"
                        title="Remove from space"
                        onClick={() => remove(m.user._id)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className={`role-badge ${m.role}`}>{m.role}</span>
                  )}
                </div>
              ))}
            </div>

            {invites.length > 0 && (
              <>
                <div className="comments-head" style={{ marginTop: 18 }}>
                  Pending invites
                </div>
                <div className="member-list">
                  {invites.map((inv) => (
                    <div className="member-row" key={inv._id}>
                      <div className="member-info">
                        <span className="member-name">{inv.email}</span>
                        <span className="member-email">
                          invited as {inv.role} · not signed up yet
                        </span>
                      </div>
                      {canManage && (
                        <button
                          className="comment-del"
                          title="Cancel invite"
                          onClick={() => cancelInvite(inv._id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
