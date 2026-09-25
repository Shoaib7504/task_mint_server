import { z } from "zod";

export const RegisterSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required").optional(),
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.string().optional(),
    photoUrl: z.string().optional(),
  })
  .passthrough()
  .refine((data) => data.fullName || data.name, {
    message: "Name or fullName is required",
    path: ["fullName"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
