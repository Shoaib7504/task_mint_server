import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import submissionRouter from "./routes/submissionRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import withdrawalRouter from "./routes/withdrawalRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import roleRequestRouter from "./routes/roleRequestRoutes.js";
import { dbConnect, dbClose } from "./config/db.connect.js";

const app = express();
const port = process.env.PORT || 5000;

//cors use for front-end communication
const allowedOrigins = [
  "https://task-mint-blue.vercel.app",
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsers with increased payload limits (default is only 100kb)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//cookieParser use for store cookie in client browser
app.use(cookieParser());

// Connect database
dbConnect();

// Routes
app.use("/auth", authRouter);
app.use("/tasks", taskRouter);
app.use("/submissions", submissionRouter);
app.use("/payments", paymentRouter);
app.use("/withdrawals", withdrawalRouter);
app.use("/notifications", notificationRouter);
app.use("/users", userRouter);
app.use("/dashboard", dashboardRouter);
app.use("/role-requests", roleRequestRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Task Mint Server is running!",
    success: true,
    statusCode: 200,
    error: null,
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Submission payload is too large. If uploading screenshots, please compress them or provide an image link.",
    });
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS error: Request origin is not allowed",
    });
  }

  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Graceful shutdown
  process.on("unhandledRejection", async (err) => {
    console.log("Unhandled Rejection", err);
    server.close(async () => {
      await dbClose();
      process.exit(1);
    });
  });

  process.on("uncaughtException", async (err) => {
    console.log("Uncaught Exception", err);
    await dbClose();
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await dbClose();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await dbClose();
    process.exit(0);
  });
}

export default app;