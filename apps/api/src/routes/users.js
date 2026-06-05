import { Router } from "express";
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.js';
import { getTopUsers } from '../lib/leaderboard.js';
import { maskSensitiveData } from '../middleware/rbac.js';

const router = Router();

// 1. Get leaderboards (All Time, Weekly, Monthly)
router.get("/leaderboard", cacheMiddleware(10), async (req, res) => {
  const { period } = req.query; // 'weekly', 'monthly', 'all_time' (default)

  try {
    // Attempt to get from Redis for All Time (the most common)
    if (!period || period === 'all_time') {
      const topUsers = await getTopUsers(25);
      if (topUsers) {
        return res.json(topUsers);
      }
    }

    // Fallback to MongoDB for other periods or if Redis is empty
    let users = [];
    if (period === 'weekly') {
      users = await User.find()
        .sort({ reputationScore: -1 })
        .limit(20)
        .select('username avatarUrl xp level reputationScore badges');
    } else if (period === 'monthly') {
      users = await User.find()
        .sort({ xp: -1, reputationScore: -1 })
        .limit(20)
        .select('username avatarUrl xp level reputationScore badges');
    } else {
      // Default: All Time
      users = await User.find()
        .sort({ xp: -1 })
        .limit(25)
        .select('username avatarUrl xp level reputationScore badges collaborationScore innovationScore consistencyScore communicationScore perfectionScore adaptabilityScore');
    }

    res.json(users);
  } catch (error) {
    console.error("❌ Fetch Leaderboard Error:", error.message);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// 2. Retrieve notifications for authenticated user
router.get("/notifications", authenticate, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.warn("⚠️ Notifications request with missing user context in token");
      return res.status(401).json({ message: "Invalid user context" });
    }

    const notifications = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("❌ Fetch Notifications Error:", error.message);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

// 3. Mark all notifications as read
router.put("/notifications/read-all", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Read All Notifications Error:", error.message);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

// 4. Mark specific notification as read
router.put("/notifications/:id/read", authenticate, validateObjectId, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (error) {
    console.error("❌ Read Single Notification Error:", error.message);
    res.status(500).json({ message: "Failed to update notification status" });
  }
});

// 5. Update user's profile metadata and roles
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { bio, skills, roles, email, phone, country, timezone } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map(s => s.trim()).filter(s => s !== "");
    }
    if (roles !== undefined && Array.isArray(roles)) {
      // Validate roles enum values
      const validRoles = roles.filter(role => ['PROJECT_OWNER', 'DEVELOPER', 'TESTER', 'ADMIN', 'TEAM'].includes(role));
      if (validRoles.length > 0) {
        updateData.roles = validRoles;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true }
    ).select("-githubAccessToken");
    
    // Clear user profile cache
    if (user) {
      clearCache(`/users/profile/${user.username}`);
      clearCache('/users/leaderboard');
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Update Profile Error:", error.message);
    res.status(500).json({ message: "Failed to update profile info" });
  }
});

// 6. Retrieve comprehensive user profile (portfolios, analytics, submissions)
router.get("/profile/:username", cacheMiddleware(60), async (req, res) => {
  try {
    const rawUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${req.params.username}$`, "i") } 
    }).lean();
    if (!rawUser) return res.status(404).json({ message: "User not found" });

    // Handle authentication for masking
    let viewer = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        viewer = await User.findById(decoded.userId).select("role").lean();
      } catch (e) {
        // Ignore auth error for public view
      }
    }
    
    const user = maskSensitiveData(rawUser, viewer);

    // Fetch user submissions with deep populated project info
    const submissions = await Submission.find({ user: user._id })
      .populate('project')
      .sort({ createdAt: -1 });

    // Unique submissions mapping
    const uniqueSubmissions = [];
    const seenProjects = new Set();
    
    for (const sub of submissions) {
      if (!sub.project) continue;
      const projectId = sub.project._id.toString();
      if (!seenProjects.has(projectId)) {
        uniqueSubmissions.push(sub);
        seenProjects.add(projectId);
      }
    }

    // Projects owned by this user
    const ownedProjects = await Project.find({ owner: user._id })
      .sort({ createdAt: -1 });

    // Ensure valid accepted projects and populate them
    const uniqueAcceptedIds = Array.from(new Set(
      (user.acceptedProjects || [])
        .map(id => id.toString())
    ));
    
    const populatedAccepted = await Project.find({ 
      _id: { $in: uniqueAcceptedIds },
      status: 'OPEN' // Only show open projects as "accepted"
    }).select('title difficulty bounty repoUrl branchName');

    res.json({ 
      ...user, 
      submissions: uniqueSubmissions, 
      ownedProjects, 
      acceptedProjects: populatedAccepted 
    });
  } catch (error) {
    console.error("❌ Fetch Public Profile Error:", error.message);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

export default router;