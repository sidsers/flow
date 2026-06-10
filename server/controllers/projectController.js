import Project from "../models/Project.js";
import Issue from "../models/Issue.js";
import { canAccessSpace, canManageSpace } from "../utils/access.js";

// GET /api/projects?space=SPACE_ID — list projects in one space.
export async function listProjects(req, res) {
  try {
    const { space } = req.query;
    if (!space) {
      return res.status(400).json({ message: "A space id is required." });
    }
    if (!(await canAccessSpace(req.user, space))) {
      return res.status(403).json({ message: "You don't have access to this space." });
    }
    const projects = await Project.find({ space })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/projects — create a project inside a space.
export async function createProject(req, res) {
  try {
    const { name, key, description, space } = req.body;

    if (!name || !key || !space) {
      return res
        .status(400)
        .json({ message: "Name, key, and space are required." });
    }
    if (!(await canAccessSpace(req.user, space))) {
      return res.status(403).json({ message: "You don't have access to this space." });
    }

    const project = await Project.create({
      space,
      name,
      key: key.toUpperCase(),
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// DELETE /api/projects/:id — delete a project and its issues.
// Allowed for the project's creator, or a lead/admin of its space.
export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const isCreator = String(project.createdBy) === String(req.user._id);
    const canManage = await canManageSpace(req.user, project.space);
    if (!isCreator && !canManage) {
      return res
        .status(403)
        .json({ message: "You can't delete this project." });
    }

    await Issue.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: "Project deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
