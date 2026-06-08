import express from "express";
import {
  listProjects,
  createProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Every project route requires being logged in.
router.use(protect);

router.get("/", listProjects);
router.post("/", createProject);
router.delete("/:id", deleteProject);

export default router;
