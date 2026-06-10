import express from "express";
import { listUsers, setUserRole } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", listUsers);
router.put("/:id/role", setUserRole);

export default router;
