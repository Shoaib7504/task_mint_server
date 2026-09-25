import express from "express";
import { fakeCheckout, getPaymentHistory } from "../controller/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

router.post("/fake-checkout", authMiddleware, authorizeRoles("BUYER"), fakeCheckout);
router.get("/history", authMiddleware, authorizeRoles("BUYER"), getPaymentHistory);

export default router;
