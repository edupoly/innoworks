import { Router } from "express";
import { Evaluation } from '../models/Evaluation.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { calculateOverallScore, updateUserRatings } from '../lib/evaluation.js';
import { sendNotification } from '../lib/notifications.js';
import { clearCache } from '../middleware/cache.js';

const router = Router();

router.use(authenticate);

/**
 * POST /api/evaluations
 * Submit an evaluation for a contributor
 */
router.post("/", async (req, res) => {
  try {
    const { contributorId, projectId, submissionId, categories, feedback, type = 'PLATFORM' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only project owner or admin can evaluate
    if (project.owner.toString() !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Only the project owner can evaluate this contribution." });
    }

    const overallScore = calculateOverallScore(categories);

    // If there's an existing pending evaluation (from GitHub merge), update it
    let evaluation = await Evaluation.findOne({ 
      contributor: contributorId, 
      project: projectId, 
      isPending: true 
    });

    if (evaluation) {
      evaluation.evaluator = req.user.userId;
      evaluation.categories = categories;
      evaluation.overallScore = overallScore;
      evaluation.feedback = feedback;
      evaluation.isPending = false;
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        contributor: contributorId,
        evaluator: req.user.userId,
        project: projectId,
        submission: submissionId,
        type,
        categories,
        overallScore,
        feedback,
        isPending: false
      });
    }

    // Update user's aggregate ratings
    await updateUserRatings(contributorId);

    // Notify contributor
    const contributor = await User.findById(contributorId);
    await sendNotification(
      contributorId,
      'ACHIEVEMENT_UNLOCKED',
      `⭐ You've received a new performance evaluation for "${project.title}"! Overall Rating: ${overallScore}/10`,
      `/profile/${contributor.username}`
    );

    // Clear caches
    clearCache(`/users/profile/${contributor.username}`);
    clearCache('/users/leaderboard');

    res.json({ message: "Evaluation submitted successfully", evaluation });
  } catch (error) {
    console.error("❌ Evaluation Error:", error.message);
    res.status(500).json({ message: "Failed to submit evaluation" });
  }
});

/**
 * GET /api/evaluations/pending
 * Get pending evaluations for the current user (if they are a project owner)
 */
router.get("/pending", async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ 
      evaluator: req.user.userId, 
      isPending: true 
    }).populate('contributor', 'username avatarUrl')
      .populate('project', 'title');

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending evaluations" });
  }
});

/**
 * GET /api/evaluations/user/:username
 * Get evaluation history for a user
 */
router.get("/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const evaluations = await Evaluation.find({ 
      contributor: user._id, 
      isPending: false 
    }).populate('evaluator', 'username avatarUrl')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch evaluations" });
  }
});

export default router;
