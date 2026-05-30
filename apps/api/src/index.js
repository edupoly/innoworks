import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import webhookRoutes from './routes/webhooks.js';
import submissionRoutes from './routes/submissions.js';
import userRoutes from './routes/users.js';
import "./workers/testWorker.js";
import connectDB from "./lib/mongodb.js";
import mongoose from "mongoose";

import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// Connect to MongoDB with error handling
connectDB().catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  console.log("⚠️ Server starting without DB - check your MONGODB_URI");
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Relaxed CORS for development and OAuth
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Relaxed Helmet for OAuth redirects and development
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false 
}));

app.use(morgan("dev"));

app.use(
  "/webhooks",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  webhookRoutes,
);

app.use(express.json());

// Silence favicon.ico logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/submissions", submissionRoutes);
app.use("/users", userRoutes);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret')) {
  console.error("❌ FATAL: JWT_SECRET must be set to a secure value in production!");
  process.exit(1);
}

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User socket ${socket.id} joined room: ${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

export { app, io };
