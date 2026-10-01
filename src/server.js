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

app.use(express.json());

//cors use for front-end communication
const allowedOrigins = [
  "https://task-mint-blue.vercel.app",
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


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