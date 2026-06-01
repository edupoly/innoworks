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
import rateLimit from 'express-rate-limit';

const app = express();
const httpServer = createServer(app);

// Trust proxy if behind Render or similar load balancer
app.set('trust proxy', 1);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});

// Apply rate limiter to all requests
app.use(limiter);

// Specific rate limit for Auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 auth requests per hour
  message: { message: "Too many login attempts, please try again after an hour" }
});
app.use("/auth/github", authLimiter);

// Connect to MongoDB with error handling
connectDB().catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  console.log("⚠️ Server starting without DB - check your MONGODB_URI");
});

let FRONTEND_URL = process.env.FRONTEND_URL || "https://innoworks.vercel.app";
if (FRONTEND_URL.endsWith("/")) FRONTEND_URL = FRONTEND_URL.slice(0, -1);

const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, "https://innoworkss.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Relaxed CORS for development and OAuth
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [FRONTEND_URL, "https://innoworkss.netlify.app", "http://localhost:5173", "http://localhost:3000"];
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
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

const requiredEnvVars = [
  'MONGODB_URI',
  'REDIS_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'JWT_SECRET',
  'FRONTEND_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ WARNING: Environment variable "${envVar}" is missing!`);
  }
});

if (process.env.NODE_ENV === 'production') {
  const criticalVars = ['MONGODB_URI', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'JWT_SECRET'];
  criticalVars.forEach(v => {
    if (!process.env[v] || process.env[v] === 'secret') {
      console.error(`❌ FATAL: Critical environment variable "${v}" is missing or insecure in production!`);
      process.exit(1);
    }
  });
}

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Platform API",
    status: "healthy",
    docs: "https://github.com/edupoly/innoworks"
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
