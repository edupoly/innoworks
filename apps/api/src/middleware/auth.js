import jwt from "jsonwebtoken";
import "dotenv/config";
import { getRedisConnection } from "../lib/redis.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required: No token provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Authentication required: Malformed token header" });
  }

  const token = parts[1];

  try {
    // Check if token is blocklisted in Redis
    const redis = getRedisConnection();
    if (redis) {
      const isBlocklisted = await redis.get(`blocklist:${token}`);
      if (isBlocklisted) {
        return res.status(401).json({ message: "Authentication required: Token has been invalidated" });
      }
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) {
      throw new Error("Invalid token payload: missing userId");
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error.message);
    return res.status(401).json({ 
      message: `Authentication required: ${error.message === 'jwt expired' ? 'Token expired' : 'Invalid token'}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const verifyProjectOwnership = (ProjectModel) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ message: "Project ID is required" });

    const project = await ProjectModel.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. Only the Project Owner can perform this action." });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error("❌ Ownership Validation Error:", error.message);
    res.status(500).json({ message: "Ownership validation failed" });
  }
};
