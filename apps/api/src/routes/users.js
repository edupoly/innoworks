import { Router } from "express";
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 })
      .limit(10)
      .select('username avatarUrl xp collaborationScore innovationScore consistencyScore communicationScore perfectionScore adaptabilityScore');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

// Update profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { bio, skills } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { bio, skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(s => s !== "") },
      { new: true }
    ).select("-githubAccessToken");
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Get user profile
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const submissions = await Submission.find({ user: user._id })
      .populate('project')
      .sort({ createdAt: -1 });

    // Filter duplicates and orphaned submissions - keep only the most recent valid submission per project
    const uniqueSubmissions = [];
    const seenProjects = new Set();
    
    for (const sub of submissions) {
      if (!sub.project) continue; // Skip orphaned submissions
      
      const projectId = sub.project._id.toString();
      if (!seenProjects.has(projectId)) {
        uniqueSubmissions.push(sub);
        seenProjects.add(projectId);
      }
    }

    const ownedProjects = await Project.find({ owner: user._id })
      .sort({ createdAt: -1 });

    // Ensure unique AND valid accepted projects (check if they still exist)
    const validProjects = await Project.find({ _id: { $in: user.acceptedProjects || [] } }).select('_id');
    const validProjectIds = new Set(validProjects.map(p => p._id.toString()));
    const uniqueAccepted = Array.from(new Set(
      (user.acceptedProjects || [])
        .map(id => id.toString())
        .filter(id => validProjectIds.has(id))
    ));

    res.json({ ...user, submissions: uniqueSubmissions, ownedProjects, acceptedProjects: uniqueAccepted });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

export default router;