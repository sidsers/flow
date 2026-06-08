import express from "express";
import {
  listComments,
  createComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listComments);
router.post("/", createComment);
router.delete("/:id", deleteComment);

export default router;
