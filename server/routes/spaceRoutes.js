import express from "express";
import {
  listSpaces,
  createSpace,
  listMembers,
  inviteToSpace,
  updateMemberRole,
  removeMember,
  cancelInvite,
} from "../controllers/spaceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listSpaces);
router.post("/", createSpace);
router.get("/:id/members", listMembers);
router.post("/:id/invite", inviteToSpace);
router.put("/:id/members/:userId", updateMemberRole);
router.delete("/:id/members/:userId", removeMember);
router.delete("/:id/invites/:inviteId", cancelInvite);

export default router;
