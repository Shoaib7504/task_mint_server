import express from "express";
import {
  submitRoleRequest,
  getMyRoleRequest,
  getAllRoleRequests,
  resolveRoleRequest,
} from "../controller/roleRequestController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Worker routes
router.post("/", authMiddleware, authorizeRoles("WORKER"), submitRoleRequest);
router.get("/my", authMiddleware, getMyRoleRequest);

// Admin routes
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllRoleRequests);
router.patch("/:id", authMiddleware, authorizeRoles("ADMIN"), resolveRoleRequest);

export default router;
