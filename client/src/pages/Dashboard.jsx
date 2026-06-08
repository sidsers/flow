import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as data from "../resources.js";
import Board from "../components/Board.jsx";
import IssueModal from "../components/IssueModal.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state: null = closed, "new" = creating, an issue object = editing.
  const [modal, setModal] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // Search & filter state.
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // Apply search + filters to the issues before showing them on the board.
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

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // On first load, fetch projects and the user list.
  useEffect(() => {
    Promise.all([data.getProjects(), data.getUsers()])
      .then(([projs, us]) => {
        setProjects(projs);
        setUsers(us);
        if (projs.length > 0) setActiveProject(projs[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Whenever the active project changes, load its issues.
  useEffect(() => {
    if (!activeProject) {
      setIssues([]);
      return;
    }
    data.getIssues(activeProject._id).then(setIssues);
  }, [activeProject]);

  async function handleCreateProject(name, key) {
    const proj = await data.createProject({ name, key });
    setProjects([proj, ...projects]);
    setActiveProject(proj);
    setShowNewProject(false);
  }

  // Drag-and-drop: optimistically move the card, then save to the server.
  async function handleMove(issue, newStatus) {
    setIssues((prev) =>
      prev.map((i) => (i._id === issue._id ? { ...i, status: newStatus } : i))
    );
    const updated = await data.updateIssue(issue._id, { status: newStatus });
    setIssues((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  }

  async function handleSaveIssue(form) {
    if (modal === "new") {
      const created = await data.createIssue({
        ...form,
        project: activeProject._id,
      });
      setIssues((prev) => [...prev, created]);
    } else {
      const updated = await data.updateIssue(modal._id, form);
      setIssues((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    }
    setModal(null);
  }

  async function handleDeleteIssue(issue) {
    await data.deleteIssue(issue._id);
    setIssues((prev) => prev.filter((i) => i._id !== issue._id));
    setModal(null);
  }

  if (loading) return <div className="center-screen">Loading your workspace…</div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand sidebar-brand">
          <span className="brand-mark">F</span>
          <span className="brand-name">Flow</span>
        </div>

        <div className="nav-label">Projects</div>
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

        <div className="sidebar-foot">
          <div className="avatar small">{initials}</div>
          <div className="who">
            <div className="who-name">{user?.name}</div>
            <button className="link-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {activeProject ? (
          <>
            <header className="topbar">
              <div>
                <h1 className="page-title">{activeProject.name}</h1>
                <p className="page-sub">
                  {issues.length} issue{issues.length === 1 ? "" : "s"} ·{" "}
                  {activeProject.key}
                </p>
              </div>
              <button className="btn-primary" onClick={() => setModal("new")}>
                + Create issue
              </button>
            </header>

            <div className="toolbar">
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search issues…"
                />
              </div>

              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map((u) => (
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

            <Board issues={visibleIssues} onMove={handleMove} onOpen={setModal} />
          </>
        ) : (
          <div className="blank-state">
            <h2>Welcome to Flow, {user?.name?.split(" ")[0]} 👋</h2>
            <p>Create your first project to start tracking work.</p>
            <button
              className="btn-primary"
              onClick={() => setShowNewProject(true)}
            >
              + New project
            </button>
          </div>
        )}
      </main>

      {modal && (
        <IssueModal
          issue={modal === "new" ? null : modal}
          users={users}
          onSave={handleSaveIssue}
          onDelete={handleDeleteIssue}
          onClose={() => setModal(null)}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          onCreate={handleCreateProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  );
}

// A small modal just for creating a project.
function NewProjectModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-suggest a key from the project name (first letters / first word).
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
