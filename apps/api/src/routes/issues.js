import { Router } from "express";
import { Issue } from '../models/Issue.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';
import { createIssue as createGithubIssue, parseRepoUrl, runGraphQL } from '../lib/github.js';

const router = Router();

/**
 * GET /issues/:projectId
 * List all issues for a project (Syncs with GitHub first)
 */
router.get("/:projectId", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (user && user.githubAccessToken && project.repoUrl) {
      try {
        const { owner, repo } = parseRepoUrl(project.repoUrl);
        const query = `
          query GetIssues($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
              issues(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
                nodes {
                  number
                  title
                  body
                  state
                  createdAt
                  url
                  author {
                    login
                    avatarUrl
                  }
                }
              }
            }
          }
        `;
        const rawData = await runGraphQL(user.githubAccessToken, query, { owner, name: repo });
        const githubIssues = rawData.repository?.issues?.nodes || [];

        // Sync to local DB
        for (const ghIssue of githubIssues) {
          const existingIssue = await Issue.findOne({ project: projectId, githubIssueNumber: ghIssue.number });
          if (existingIssue) {
            existingIssue.githubState = ghIssue.state;
            existingIssue.status = ghIssue.state === 'OPEN' ? 'Open' : 'Closed';
            await existingIssue.save();
          } else {
            await Issue.create({
              title: ghIssue.title,
              description: ghIssue.body || '',
              project: projectId,
              githubIssueNumber: ghIssue.number,
              githubIssueUrl: ghIssue.url,
              githubAuthor: {
                username: ghIssue.author?.login,
                avatarUrl: ghIssue.author?.avatarUrl
              },
              githubState: ghIssue.state,
              status: ghIssue.state === 'OPEN' ? 'Open' : 'Closed',
              author: req.user.userId, // User who initiated sync
              timeline: [{
                action: 'SYNCED_FROM_GITHUB',
                actor: req.user.userId,
                timestamp: Date.now()
              }]
            });
          }
        }
      } catch (ghError) {
        console.error("⚠️ Failed to sync issues from GitHub:", ghError.message);
        // Continue and return local issues even if sync fails
      }
    }

    const issues = await Issue.find({ project: projectId })
      .populate('author', 'username avatarUrl')
      .populate('assignees', 'username avatarUrl')
      .sort({ isVerified: -1, createdAt: -1 });
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

    const updatedIssue = await Issue.findByIdAndUpdate(id, { $set: req.body }, { returnDocument: 'after' });
    
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
