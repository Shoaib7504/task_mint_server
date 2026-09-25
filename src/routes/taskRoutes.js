import express from "express";
import {
  getTasks,
  getFeaturedTasks,
  getTaskById,
  createTask,
  getMyTasks,
  updateTask,
  deleteTask,
} from "../controller/taskController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Public routes
router.get("/", getTasks);
router.get("/featured", getFeaturedTasks);
router.get("/buyer/my-tasks", authMiddleware, authorizeRoles("BUYER"), getMyTasks);
router.get("/:id", getTaskById);

// Protected routes
router.post("/", authMiddleware, authorizeRoles("BUYER"), createTask);
router.put("/:id", authMiddleware, authorizeRoles("BUYER", "ADMIN"), updateTask);
router.delete("/:id", authMiddleware, authorizeRoles("BUYER", "ADMIN"), deleteTask);

export default router;
