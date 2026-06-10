import Issue from "../models/Issue.js";
import Project from "../models/Project.js";
import { canAccessProject, canAccessIssue } from "../utils/access.js";

// A small helper to re-fetch an issue with its people filled in,
// so the frontend gets names instead of raw IDs.
function populateIssue(query) {
  return query
    .populate("assignee", "name email")
    .populate("reporter", "name email");
}

// GET /api/issues?project=PROJECT_ID — list all issues for one project
export async function listIssues(req, res) {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ message: "A project id is required." });
    }
    if (!(await canAccessProject(req.user, project))) {
      return res.status(403).json({ message: "You don't have access to this project." });
    }

    const issues = await populateIssue(
      Issue.find({ project }).sort({ createdAt: 1 })
    );
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/issues — create a new issue
export async function createIssue(req, res) {
  try {
    const { title, description, priority, status, project, assignee } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: "Title and project are required." });
    }
    if (!(await canAccessProject(req.user, project))) {
      return res.status(403).json({ message: "You don't have access to this project." });
    }

    const proj = await Project.findById(project);
    if (!proj) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Bump the project's counter so this issue gets a unique label.
    proj.issueCounter += 1;
    await proj.save();
    const label = `${proj.key}-${proj.issueCounter}`;

    const issue = await Issue.create({
      title,
      description: description || "",
      priority: priority || "medium",
      status: status || "todo",
      project,
      assignee: assignee || null,
      reporter: req.user._id,
      label,
    });

    const populated = await populateIssue(Issue.findById(issue._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// PUT /api/issues/:id — update an issue (status, title, assignee, etc.)
export async function updateIssue(req, res) {
  try {
    if (!(await canAccessIssue(req.user, req.params.id))) {
      return res.status(403).json({ message: "You don't have access to this issue." });
    }
    const allowed = ["title", "description", "status", "priority", "assignee"];
    const updates = {};
    for (const field of allowed) {
      if (field in req.body) updates[field] = req.body[field];
    }
    // An empty assignee string means "unassigned".
    if (updates.assignee === "") updates.assignee = null;

    const issue = await populateIssue(
      Issue.findByIdAndUpdate(req.params.id, updates, { new: true })
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/issues/:id — delete an issue
export async function deleteIssue(req, res) {
  try {
    if (!(await canAccessIssue(req.user, req.params.id))) {
      return res.status(403).json({ message: "You don't have access to this issue." });
    }
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }
    res.json({ message: "Issue deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
