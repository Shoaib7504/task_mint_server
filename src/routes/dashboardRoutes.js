import express from "express";
import {
  getBuyerDashboardStats,
  getWorkerDashboardStats,
  getAdminDashboardStats,
} from "../controller/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

router.get("/buyer-stats", authMiddleware, authorizeRoles("BUYER"), getBuyerDashboardStats);
router.get("/worker-stats", authMiddleware, authorizeRoles("WORKER"), getWorkerDashboardStats);
router.get("/admin-stats", authMiddleware, authorizeRoles("ADMIN"), getAdminDashboardStats);

export default router;
