import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import { dbConnect, dbClose } from "./config/db.connect.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

//cors use for front-end communication
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

//cookieParser use for store cookie in client browser
app.use(cookieParser());

// Connect database
dbConnect();

// Routes
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Task Mint Server is running!",
    success: true,
    statusCode: 200,
    error: null,
  });
});

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