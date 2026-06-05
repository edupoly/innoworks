import { Router } from "express";
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit, maskSensitiveData } from '../middleware/rbac.js';

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

export default router;
