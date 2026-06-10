import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as data from "../resources.js";
import Board from "../components/Board.jsx";
import IssueModal from "../components/IssueModal.jsx";
import SpaceMembersModal from "../components/SpaceMembersModal.jsx";
import AdminUsersModal from "../components/AdminUsersModal.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isOrgAdmin = user?.role === "admin";

  const [spaces, setSpaces] = useState([]);
  const [activeSpace, setActiveSpace] = useState(null);

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  const [issues, setIssues] = useState([]);
  const [members, setMembers] = useState([]); // [{user, role, membershipId}]
  const [loading, setLoading] = useState(true);

  // Modals
  const [issueModal, setIssueModal] = useState(null); // null | "new" | issue
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Load the spaces this user can see.
  useEffect(() => {
    data
      .getSpaces()
      .then((sp) => {
        setSpaces(sp);
        if (sp.length > 0) setActiveSpace(sp[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // When the active space changes, load its projects and members.
  useEffect(() => {
    if (!activeSpace) {
      setProjects([]);
      setActiveProject(null);
      setMembers([]);
      return;
    }
    data.getProjects(activeSpace._id).then((projs) => {
      setProjects(projs);
      setActiveProject(projs[0] || null);
    });
    data.getMembers(activeSpace._id).then((res) => setMembers(res.members));
  }, [activeSpace]);

  // When the active project changes, load its issues.
  useEffect(() => {
    if (!activeProject) {
      setIssues([]);
      return;
    }
    data.getIssues(activeProject._id).then(setIssues);
  }, [activeProject]);

  // People you can assign issues to = members of the current space.
  const assignableUsers = members.map((m) => m.user);

  const canManageSpace =
    activeSpace &&
    (activeSpace.myRole === "lead" || activeSpace.myRole === "admin");

  // Filtered view of issues for the board.
  const visibleIssues = issues.filter((i) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      i.label.toLowerCase().includes(q);
    const matchesAssignee =
      filterAssignee === "all" ||
      (filterAssignee === "unassigned" && !i.assignee) ||
      i.assignee?._id === filterAssignee;
    const matchesPriority =
      filterPriority === "all" || i.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesPriority;
  });
  const filtersActive =
    search.trim() || filterAssignee !== "all" || filterPriority !== "all";

  async function handleCreateSpace(name, description) {
    const space = await data.createSpace({ name, description });
    setSpaces([...spaces, space]);
    setActiveSpace(space);
    setShowNewSpace(false);
  }

  async function handleCreateProject(name, key) {
    const proj = await data.createProject({
      name,
      key,
      space: activeSpace._id,
    });
    setProjects([proj, ...projects]);
    setActiveProject(proj);
    setShowNewProject(false);
  }

  async function handleMove(issue, newStatus) {
    setIssues((prev) =>
      prev.map((i) => (i._id === issue._id ? { ...i, status: newStatus } : i))
    );
    const updated = await data.updateIssue(issue._id, { status: newStatus });
    setIssues((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  }

  async function handleSaveIssue(form) {
    if (issueModal === "new") {
      const created = await data.createIssue({
        ...form,
        project: activeProject._id,
      });
      setIssues((prev) => [...prev, created]);
    } else {
      const updated = await data.updateIssue(issueModal._id, form);
      setIssues((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      );
    }
    setIssueModal(null);
  }

  async function handleDeleteIssue(issue) {
    await data.deleteIssue(issue._id);
    setIssues((prev) => prev.filter((i) => i._id !== issue._id));
    setIssueModal(null);
  }

  if (loading) return <div className="center-screen">Loading your workspace…</div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand sidebar-brand">
          <span className="brand-mark">F</span>
          <span className="brand-name">Flow</span>
        </div>

        <div className="nav-label">Spaces</div>
        <nav className="nav">
          {spaces.map((s) => (
            <a
              key={s._id}
              className={`nav-item ${activeSpace?._id === s._id ? "active" : ""}`}
              onClick={() => setActiveSpace(s)}
            >
              <span className="space-name">{s.name}</span>
              <span className={`role-badge ${s.myRole}`}>{s.myRole}</span>
            </a>
          ))}
          {spaces.length === 0 && (
            <span className="nav-empty">No spaces yet</span>
          )}
        </nav>
        {isOrgAdmin && (
          <button className="btn-add-project" onClick={() => setShowNewSpace(true)}>
            + New space
          </button>
        )}

        {activeSpace && (
          <>
            <div className="nav-label" style={{ marginTop: 20 }}>
              Projects · {activeSpace.name}
            </div>
            <nav className="nav">
              {projects.map((p) => (
                <a
                  key={p._id}
                  className={`nav-item ${
                    activeProject?._id === p._id ? "active" : ""
                  }`}
                  onClick={() => setActiveProject(p)}
                >
                  <span className="proj-key">{p.key}</span>
                  {p.name}
                </a>
              ))}
              {projects.length === 0 && (
                <span className="nav-empty">No projects yet</span>
              )}
            </nav>
            <button
              className="btn-add-project"
              onClick={() => setShowNewProject(true)}
            >
              + New project
            </button>
            <button className="btn-add-project" onClick={() => setShowMembers(true)}>
              Members
            </button>
          </>
        )}

        <div className="sidebar-foot">
          <div className="avatar small">{initials}</div>
          <div className="who">
            <div className="who-name">
              {user?.name}
              {isOrgAdmin && <span className="org-tag">admin</span>}
            </div>
            <button className="link-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
        {isOrgAdmin && (
          <button
            className="link-btn admin-link"
            onClick={() => setShowAdmin(true)}
          >
            Manage org admins
          </button>
        )}
      </aside>

      <main className="main">
        {activeProject ? (
          <>
            <header className="topbar">
              <div>
                <h1 className="page-title">{activeProject.name}</h1>
                <p className="page-sub">
                  {issues.length} task{issues.length === 1 ? "" : "s"} ·{" "}
                  {activeProject.key} · {activeSpace.name}
                </p>
              </div>
              <button className="btn-primary" onClick={() => setIssueModal("new")}>
                + Create task
              </button>
            </header>

            <div className="toolbar">
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                />
              </div>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {filtersActive && (
                <button
                  className="clear-filters"
                  onClick={() => {
                    setSearch("");
                    setFilterAssignee("all");
                    setFilterPriority("all");
                  }}
                >
                  Clear
                </button>
              )}
              <span className="result-count">
                {visibleIssues.length} of {issues.length}
              </span>
            </div>

            <Board
              issues={visibleIssues}
              onMove={handleMove}
              onOpen={setIssueModal}
            />
          </>
        ) : activeSpace ? (
          <div className="blank-state">
            <h2>{activeSpace.name}</h2>
            <p>No projects in this space yet.</p>
            <button className="btn-primary" onClick={() => setShowNewProject(true)}>
              + New project
            </button>
          </div>
        ) : (
          <div className="blank-state">
            {isOrgAdmin ? (
              <>
                <h2>Welcome to Flow 👋</h2>
                <p>Create your first space to get started.</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowNewSpace(true)}
                >
                  + New space
                </button>
              </>
            ) : (
              <>
                <h2>No spaces yet</h2>
                <p>
                  You haven't been added to any spaces. Ask an org admin or a
                  space lead to invite you.
                </p>
              </>
            )}
          </div>
        )}
      </main>

      {issueModal && (
        <IssueModal
          issue={issueModal === "new" ? null : issueModal}
          users={assignableUsers}
          onSave={handleSaveIssue}
          onDelete={handleDeleteIssue}
          onClose={() => setIssueModal(null)}
        />
      )}
      {showNewProject && (
        <NewProjectModal
          onCreate={handleCreateProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
      {showNewSpace && (
        <NewSpaceModal
          onCreate={handleCreateSpace}
          onClose={() => setShowNewSpace(false)}
        />
      )}
      {showMembers && activeSpace && (
        <SpaceMembersModal
          space={activeSpace}
          onClose={() => setShowMembers(false)}
        />
      )}
      {showAdmin && <AdminUsersModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function NewProjectModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  function handleName(value) {
    setName(value);
    if (!key || key === autoKey(name)) setKey(autoKey(value));
  }
  function autoKey(n) {
    return n
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);
  }
  async function submit() {
    if (!name.trim() || !key.trim()) return;
    setBusy(true);
    try {
      await onCreate(name, key);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New project</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <label className="field">
          <span>Project name</span>
          <input
            value={name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="Website Revamp"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Key (short code on cards)</span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="WEB"
            maxLength={6}
          />
        </label>
        <div className="modal-foot">
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSpaceModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name, description);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New space</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <label className="field">
          <span>Space name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mobile Team"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this team works on"
          />
        </label>
        <div className="modal-foot">
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create space"}
          </button>
        </div>
      </div>
    </div>
  );
}
