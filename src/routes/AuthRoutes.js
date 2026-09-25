import express from "express";
import { login, LogOut, register, getMe } from "../controller/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { RegisterSchema, LoginSchema } from "../Validators/authValidators.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validateRequest(RegisterSchema), register);
router.post("/login", validateRequest(LoginSchema), login);
router.post("/logout", LogOut);
router.get("/me", authMiddleware, getMe);

export default router;
