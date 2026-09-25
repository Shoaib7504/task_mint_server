import express from "express";
import {
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
} from "../controller/withdrawalController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Worker routes
router.post("/", authMiddleware, authorizeRoles("WORKER"), createWithdrawal);
router.get("/my-withdrawals", authMiddleware, authorizeRoles("WORKER"), getMyWithdrawals);

// Admin routes
router.get("/all", authMiddleware, authorizeRoles("ADMIN"), getAllWithdrawals);
router.patch("/:id/approve", authMiddleware, authorizeRoles("ADMIN"), approveWithdrawal);

export default router;
