import { Router } from "express";
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Project } from '../models/Project.js';
import { Issue } from '../models/Issue.js';
import { Submission } from '../models/Submission.js';
import { WikiPage } from '../models/WikiPage.js';
import { ApprovalRequest } from '../models/ApprovalRequest.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';
import { getRedisConnection } from '../lib/redis.js';
import { clearCache } from '../middleware/cache.js';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * GET /admin/moderation/stats
 * Get high-level moderation metrics across the platform
 */
router.get("/moderation/stats", async (req, res) => {
  try {
    const [totalOpenIssues, approvedIssues, approvedPRs, verifiedProjects] = await Promise.all([
      Issue.countDocuments({ status: 'Open' }),
      Issue.countDocuments({ isVerified: true }),
      Submission.countDocuments({ isVerified: true, status: 'MERGED' }),
      Project.countDocuments({ isVerified: true })
    ]);

    res.json({
      totalOpenIssues,
      approvedIssues,
      approvedPRs,
      verifiedProjects
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch moderation stats" });
  }
});

/**
 * GET /admin/moderation/list/:type
 * List items for moderation with filters and pagination
 */
router.get("/moderation/list/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20, search = '', verified } = req.query;
    
    let model;
    let populateField = 'author';
    
    switch(type) {
      case 'projects': 
        model = Project; 
        populateField = 'owner';
        break;
      case 'issues': 
        model = Issue; 
        populateField = 'author';
        break;
      case 'submissions': 
        model = Submission; 
        populateField = 'user';
        break;
      case 'wiki': 
        model = WikiPage; 
        populateField = 'author';
        break;
      default: return res.status(400).json({ message: "Invalid type" });
    }

    const query = {};
    if (search) {
      if (type === 'submissions') {
        query.$or = [
          { branchName: { $regex: search, $options: 'i' } }
        ];
      } else {
        query.title = { $regex: search, $options: 'i' };
      }
    }
    
    if (verified !== undefined && verified !== '') {
      query.isVerified = verified === 'true';
    }

    const items = await model.find(query)
      .populate(populateField, 'username avatarUrl')
      .populate('project', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isVerified: 1, createdAt: -1 }); 

    const count = await model.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count
    });
  } catch (error) {
    console.error("❌ Admin List Error:", error.message);
    res.status(500).json({ message: "Failed to fetch items" });
  }
});

/**
 * PUT /admin/moderation/verify/:type/:id
 * Verify or Unverify an item
 */
router.put("/moderation/verify/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { verify, reason } = req.body;

    let model;
    switch(type) {
      case 'projects': model = Project; break;
      case 'issues': model = Issue; break;
      case 'submissions': model = Submission; break;
      case 'wiki': model = WikiPage; break;
      default: return res.status(400).json({ message: "Invalid type" });
    }

    const item = await model.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isVerified = verify;
    if (verify) {
      item.verifiedBy = req.user.userId;
      item.verifiedAt = new Date();
      item.verificationReason = reason || "Verified by Platform Administrator";
    } else {
      item.verifiedBy = undefined;
      item.verifiedAt = undefined;
      item.verificationReason = undefined;
    }

    await item.save();

    // Update User's verified contributions count
    const userId = item.user || item.author || item.owner;
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { verifiedContributionsCount: verify ? 1 : -1 }
      });
    }

    await logAudit(req, verify ? 'VERIFY_ITEM' : 'UNVERIFY_ITEM', type, id, { reason });
    
    // Clear relevant caches
    clearCache(`/projects`);
    if (type === 'projects') clearCache(`/projects/${id}`);

    res.json({ message: `Item ${verify ? 'verified' : 'unverified'} successfully`, item });
  } catch (error) {
    res.status(500).json({ message: "Failed to update verification status" });
  }
});

/**
 * PUT /admin/moderation/verify-bulk/:type
 * Verify or Unverify multiple items
 */
router.put("/moderation/verify-bulk/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { ids, verify, reason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    let model;
    switch(type) {
      case 'projects': model = Project; break;
      case 'issues': model = Issue; break;
      case 'submissions': model = Submission; break;
      case 'wiki': model = WikiPage; break;
      default: return res.status(400).json({ message: "Invalid type" });
    }

    const items = await model.find({ _id: { $in: ids } });
    
    // Update items
    const updatePromises = items.map(async (item) => {
      const wasVerified = item.isVerified;
      item.isVerified = verify;
      if (verify) {
        item.verifiedBy = req.user.userId;
        item.verifiedAt = new Date();
        item.verificationReason = reason || "Bulk verified by Platform Administrator";
      } else {
        item.verifiedBy = undefined;
        item.verifiedAt = undefined;
        item.verificationReason = undefined;
      }
      await item.save();

      // Update User count if verification state changed
      if (wasVerified !== verify) {
        const userId = item.user || item.author || item.owner;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            $inc: { verifiedContributionsCount: verify ? 1 : -1 }
          });
        }
      }
    });

    await Promise.all(updatePromises);

    await logAudit(req, verify ? 'BULK_VERIFY' : 'BULK_UNVERIFY', type, ids.join(','), { count: ids.length, reason });
    
    // Clear cache
    clearCache(`/projects`);

    res.json({ message: `Successfully ${verify ? 'verified' : 'unverified'} ${ids.length} items.` });
  } catch (error) {
    console.error("❌ Bulk Verify Error:", error.message);
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});

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

    // Clear caches
    clearCache(`/users/profile/${user.username}`);
    clearCache('/users/leaderboard');

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

    // Clear caches
    clearCache(`/users/profile/${user.username}`);

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

    // Clear caches
    clearCache(`/users/profile/${username}`);
    clearCache('/users/leaderboard');

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

    // Clear caches
    clearCache(`/projects/${id}`);
    clearCache('/projects');

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
