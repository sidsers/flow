import Project from "../models/Project.js";
import Issue from "../models/Issue.js";

// GET /api/projects — list every project (internal tool, everyone sees all)
export async function listProjects(req, res) {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// POST /api/projects — create a new project
export async function createProject(req, res) {
  try {
    const { name, key, description } = req.body;

    if (!name || !key) {
      return res.status(400).json({ message: "Name and key are required." });
    }

    const project = await Project.create({
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

// DELETE /api/projects/:id — delete a project and all its issues
export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Remove all issues that belong to this project too.
    await Issue.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
}
