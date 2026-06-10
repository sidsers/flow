import express from "express";
import {
  listAttachments,
  createAttachment,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", listAttachments);
router.post("/", createAttachment);
router.delete("/:id", deleteAttachment);

export default router;
