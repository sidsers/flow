import express from "express";
import {
  listIssues,
  createIssue,
  updateIssue,
  deleteIssue,
} from "../controllers/issueController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listIssues);
router.post("/", createIssue);
router.put("/:id", updateIssue);
router.delete("/:id", deleteIssue);

export default router;
