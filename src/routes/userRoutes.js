import express from "express";
import {
  getTopWorkers,
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  updateProfile,
} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Public routes
router.get("/top-workers", getTopWorkers);
router.get("/platform-stats", getPlatformStats);

// Authenticated profile routes
router.patch("/profile", authMiddleware, updateProfile);
router.put("/profile", authMiddleware, updateProfile);

// Admin-only routes
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllUsers);
router.patch("/:id/role", authMiddleware, authorizeRoles("ADMIN"), updateUserRole);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), deleteUser);

export default router;
