import express from "express";
import { login, LogOut, register, getMe, googleAuth } from "../controller/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { RegisterSchema, LoginSchema } from "../Validators/authValidators.js";
import { updateProfile } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validateRequest(RegisterSchema), register);
router.post("/login", validateRequest(LoginSchema), login);
router.post("/google", googleAuth);
router.post("/logout", LogOut);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);
router.put("/profile", authMiddleware, updateProfile);

export default router;
