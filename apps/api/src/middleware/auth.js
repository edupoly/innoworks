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

    if (redis) {
      const isUserBlocklisted = await redis.get(`blocklist_user:${decoded.userId}`);
      if (isUserBlocklisted) {
        return res.status(403).json({ message: "Account has been suspended by an Administrator." });
      }
    }

    let rawRole = decoded.role || 'Developer';
    let normalizedRole = 'Developer';
    
    if (rawRole.toUpperCase() === 'ADMIN') normalizedRole = 'Admin';
    else if (rawRole.toUpperCase() === 'PROJECT_OWNER' || rawRole.toUpperCase() === 'PROJECT OWNER') normalizedRole = 'Project Owner';
    else if (rawRole.toUpperCase() === 'TEAM') normalizedRole = 'Team';
    
    req.user = {
      ...decoded,
      role: normalizedRole,
      permissions: decoded.permissions || []
    };
    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error.message);
    return res.status(401).json({ 
      message: `Authentication required: ${error.message === 'jwt expired' ? 'Token expired' : 'Invalid token'}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next();
  }

  const token = parts[1];

  try {
    const redis = getRedisConnection();
    if (redis) {
      const isBlocklisted = await redis.get(`blocklist:${token}`);
      if (isBlocklisted) return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) return next();

    if (redis) {
      const isUserBlocklisted = await redis.get(`blocklist_user:${decoded.userId}`);
      if (isUserBlocklisted) return next();
    }

    let rawRole = decoded.role || 'Developer';
    let normalizedRole = 'Developer';
    
    if (rawRole.toUpperCase() === 'ADMIN') normalizedRole = 'Admin';
    else if (rawRole.toUpperCase() === 'PROJECT_OWNER' || rawRole.toUpperCase() === 'PROJECT OWNER') normalizedRole = 'Project Owner';
    else if (rawRole.toUpperCase() === 'TEAM') normalizedRole = 'Team';
    
    req.user = {
      ...decoded,
      role: normalizedRole,
      permissions: decoded.permissions || []
    };
    next();
  } catch (error) {
    // If token is invalid or expired, we just proceed as unauthenticated
    next();
  }
};

export const verifyProjectOwnership = (ProjectModel) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ message: "Project ID is required" });

    const project = await ProjectModel.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Allow Admins to bypass ownership check
    if (req.user.role === 'Admin' || project.owner.toString() === req.user.userId) {
      req.project = project;
      return next();
    }

    return res.status(403).json({ message: "Access denied. Only the Project Owner or an Admin can perform this action." });
  } catch (error) {
    console.error("❌ Ownership Validation Error:", error.message);
    res.status(500).json({ message: "Ownership validation failed" });
  }
};
