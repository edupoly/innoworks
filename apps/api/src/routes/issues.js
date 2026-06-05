import { Router } from "express";
import { Issue } from '../models/Issue.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';

const router = Router();

/**
 * GET /issues/:projectId
 * List all issues for a project
 */
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const issues = await Issue.find({ project: projectId })
      .populate('author', 'username avatarUrl')
      .populate('assignees', 'username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("❌ Fetch Issues Error:", error.message);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});

/**
 * POST /issues/:projectId
 * Create a new issue (Developer or higher)
 */
router.post("/:projectId", authenticate, authorize('Developer'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const issueData = {
      ...req.body,
      project: projectId,
      author: req.user.userId,
      timeline: [{
        action: 'CREATED',
        actor: req.user.userId,
        timestamp: Date.now()
      }]
    };

    const issue = await Issue.create(issueData);
    await logAudit(req, 'CREATE_ISSUE', 'Issue', issue._id, { title: issue.title });

    res.status(201).json(issue);
  } catch (error) {
    console.error("❌ Create Issue Error:", error.message);
    res.status(500).json({ message: "Failed to create issue" });
  }
});

/**
 * PUT /issues/:id
 * Update an issue (Author, PO, or Admin)
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Permissions check
    const isAuthor = issue.author.toString() === req.user.userId;
    const isAdmin = req.user.role === 'Admin';
    // Add PO check if needed

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Access denied." });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    
    // Add to timeline
    updatedIssue.timeline.push({
      action: 'UPDATED',
      actor: req.user.userId,
      metadata: req.body,
      timestamp: Date.now()
    });
    await updatedIssue.save();

    res.json(updatedIssue);
  } catch (error) {
    console.error("❌ Update Issue Error:", error.message);
    res.status(500).json({ message: "Failed to update issue" });
  }
});

export default router;
