import express from "express";
import {
  createSubmission,
  getMySubmissions,
  getBuyerReviews,
  approveSubmission,
  rejectSubmission,
} from "../controller/submissionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Worker routes
router.post("/", authMiddleware, authorizeRoles("WORKER"), createSubmission);
router.get("/my-submissions", authMiddleware, authorizeRoles("WORKER"), getMySubmissions);

// Buyer routes
router.get("/buyer/reviews", authMiddleware, authorizeRoles("BUYER"), getBuyerReviews);
router.patch("/:id/approve", authMiddleware, authorizeRoles("BUYER"), approveSubmission);
router.patch("/:id/reject", authMiddleware, authorizeRoles("BUYER"), rejectSubmission);

export default router;
