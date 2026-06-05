import { Router } from "express";
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Project } from '../models/Project.js';
import { ApprovalRequest } from '../models/ApprovalRequest.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit, maskSensitiveData } from '../middleware/rbac.js';
import { getRedisConnection } from '../lib/redis.js';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * GET /admin/users
 * List all users with pagination
 */
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error("❌ Admin Fetch Users Error:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/**
 * PUT /admin/users/:id/role
 * Update user role and permissions
 */
router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldRole = user.role;
    user.role = role;
    if (permissions) user.permissions = permissions;
    
    await user.save();

    await logAudit(req, 'UPDATE_USER_ROLE', 'User', id, {
      oldRole,
      newRole: role,
      permissions
    });

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("❌ Admin Update Role Error:", error.message);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

/**
 * GET /admin/logs
 * Fetch system audit logs
 */
router.get("/logs", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const logs = await AuditLog.find()
      .populate('actor', 'username avatarUrl')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ timestamp: -1 });

    const count = await AuditLog.countDocuments();

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("❌ Admin Fetch Logs Error:", error.message);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

/**
 * PUT /admin/users/:id/status
 * Block or unblock a user
 */
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Prevent blocking other Admins
    if (user.role === 'Admin') {
      return res.status(403).json({ message: "Cannot block another Administrator." });
    }

    user.status = status;
    await user.save();

    const redis = getRedisConnection();
    if (redis) {
      if (status === 'Blocked') {
        // Blacklist their ID indefinitely (or could be 30 days)
        await redis.set(`blocklist_user:${id}`, "true", "EX", 2592000); 
      } else {
        await redis.del(`blocklist_user:${id}`);
      }
    }

    await logAudit(req, 'UPDATE_USER_STATUS', 'User', id, { status });

    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    console.error("❌ Admin Update Status Error:", error.message);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

/**
 * DELETE /admin/users/:id
 * Delete a user completely from the platform
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deleting other Admins
    if (user.role === 'Admin') {
      return res.status(403).json({ message: "Cannot delete another Administrator." });
    }

    const username = user.username;
    await User.findByIdAndDelete(id);

    await logAudit(req, 'DELETE_USER', 'User', id, { username });

    res.json({ message: "User successfully deleted" });
  } catch (error) {
    console.error("❌ Admin Delete User Error:", error.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/**
 * GET /admin/projects
 * List all projects with pagination
 */
router.get("/projects", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const projects = await Project.find(query)
      .populate('owner', 'username avatarUrl')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProjects: count
    });
  } catch (error) {
    console.error("❌ Admin Fetch Projects Error:", error.message);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

/**
 * DELETE /admin/projects/:id
 * Delete a project globally
 */
router.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const title = project.title;
    await Project.findByIdAndDelete(id);

    await logAudit(req, 'DELETE_PROJECT', 'Project', id, { title });

    res.json({ message: "Project successfully deleted" });
  } catch (error) {
    console.error("❌ Admin Delete Project Error:", error.message);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

/**
 * GET /admin/requests
 * Fetch all approval requests (Wiki, Docker, etc) globally
 */
router.get("/requests", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const requests = await ApprovalRequest.find()
      .populate('requestedBy', 'username avatarUrl')
      .populate('project', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await ApprovalRequest.countDocuments();

    res.json({
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("❌ Admin Fetch Requests Error:", error.message);
    res.status(500).json({ message: "Failed to fetch approval requests" });
  }
});

export default router;
