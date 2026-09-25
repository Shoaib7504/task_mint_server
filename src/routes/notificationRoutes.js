import express from "express";
import {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
} from "../controller/notificationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markOneAsRead);

export default router;
