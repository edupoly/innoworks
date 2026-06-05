import { Router } from "express";
import { Issue } from '../models/Issue.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';
import { createIssue as createGithubIssue, parseRepoUrl } from '../lib/github.js';

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
    const { title, description, labels, ...restBody } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let githubIssueNumber;
    let githubIssueUrl;

    if (user.githubAccessToken) {
      try {
        const { owner, repo } = parseRepoUrl(project.repoUrl);
        // Format labels if they are objects
        const githubLabels = labels ? labels.map(l => typeof l === 'string' ? l : l.name) : [];
        const githubResponse = await createGithubIssue(user.githubAccessToken, owner, repo, title, description, githubLabels);
        githubIssueNumber = githubResponse.number;
        githubIssueUrl = githubResponse.html_url;
      } catch (ghError) {
        console.error("❌ Failed to replicate issue to GitHub:", ghError.message);
        // We log the error but still create the internal issue if github replication fails, or maybe we want to require it?
        // "has to replicate in github too real time". We'll just continue if it fails but log it. Or should we throw? 
        // We'll throw to ensure strict adherence.
        // But if the user wants it to just work, we should probably let it pass internally or return 500. Let's return 500 if github fails.
        return res.status(500).json({ message: `Failed to create issue on GitHub: ${ghError.message}` });
      }
    } else {
       return res.status(403).json({ message: "GitHub access token missing. Please re-authenticate." });
    }

    const issueData = {
      ...restBody,
      title,
      description,
      labels,
      project: projectId,
      author: req.user.userId,
      githubIssueNumber,
      githubIssueUrl,
      timeline: [{
        action: 'CREATED',
        actor: req.user.userId,
        timestamp: Date.now()
      }]
    };

    const issue = await Issue.create(issueData);
    await logAudit(req, 'CREATE_ISSUE', 'Issue', issue._id, { title: issue.title, githubIssueNumber });

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
