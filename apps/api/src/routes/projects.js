import { Router } from "express";
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { authenticate, verifyProjectOwnership } from '../middleware/auth.js';
import { forkRepository, fetchGraphQLRepositoryIntelligence, closeIssue } from '../lib/github.js';
import { validateObjectId, validateProject } from '../middleware/validate.js';
import { sendNotification } from '../lib/notifications.js';
import { evaluateBadges, awardXP, XP_VALUES } from '../lib/gamification.js';
import axios from 'axios';

const router = Router();

const parseRepoUrl = (url) => {
  const cleanUrl = url.replace(/\/$/, "").replace(/\.git$/, "");
  const parts = cleanUrl.replace("https://github.com/", "").split("/");
  return { owner: parts[0], repo: parts[1] };
};

// Middleware instance for project routes
const verifyOwnership = verifyProjectOwnership(Project);

// 1. Get all projects (Marketplace) with comprehensive search, filters, and sorting
router.get("/", async (req, res) => {
  try {
    const { search, difficulty, skill, sort, tech } = req.query;
    
    // Build query conditions
    const queryConditions = { status: 'OPEN' };
    
    if (search) {
      queryConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (difficulty) {
      queryConditions.difficulty = difficulty;
    }
    
    if (skill) {
      queryConditions.requiredSkills = { $in: [skill] };
    }

    if (tech) {
      queryConditions.techStack = { $in: [tech] };
    }
    
    let sortCondition = { createdAt: -1 }; // Default: Newest
    
    if (sort === 'trending') {
      sortCondition = { stars: -1, forks: -1 };
    } else if (sort === 'most_active') {
      sortCondition = { openIssuesCount: -1 };
    } else if (sort === 'most_contributors') {
      sortCondition = { contributorsCount: -1 };
    } else if (sort === 'bounty') {
      sortCondition = { bounty: -1 };
    }

    const projects = await Project.find(queryConditions)
      .populate('owner', 'username avatarUrl')
      .sort(sortCondition);

    res.json(projects);
  } catch (error) {
    console.error("❌ Fetch Projects Error:", error.message);
    res.status(500).json({ message: "Error fetching project listings" });
  }
});

// 2. Fetch Live Repository GraphQL Intelligence
router.get("/:id/intelligence", authenticate, validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub access token missing" });
    }

    const { owner, repo } = parseRepoUrl(project.repoUrl);
    const intelligence = await fetchGraphQLRepositoryIntelligence(user.githubAccessToken, owner, repo);

    res.json(intelligence);
  } catch (error) {
    console.error("❌ Live Intelligence Error:", error.message);
    res.status(500).json({ message: "Failed to load live repository statistics: " + error.message });
  }
});

// 3. Check Fork Status (Verify fork existence and default branch metadata)
router.get("/:id/fork-status", authenticate, validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub access token missing" });
    }

    const { repo } = parseRepoUrl(project.repoUrl);
    const username = user.username;

    // Check if user's fork exists
    try {
      const forkResponse = await axios.get(`https://api.github.com/repos/${username}/${repo}`, {
        headers: {
          Authorization: `token ${user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        }
      });

      res.json({
        forkExists: true,
        forkUrl: forkResponse.data.html_url,
        forkFullName: forkResponse.data.full_name,
        defaultBranch: forkResponse.data.default_branch || 'main',
        syncStatus: 'SYNCHRONIZED'
      });
    } catch (apiErr) {
      res.json({
        forkExists: false,
        message: "Repository fork not detected on your account yet."
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Fork validation failed: " + error.message });
  }
});

// 4. Create Issue directly on the Upstream GitHub repository from Innoworks
router.post("/:id/issues", authenticate, validateObjectId, async (req, res) => {
  const { title, body, labels } = req.body;
  if (!title) return res.status(400).json({ message: "Issue title is required" });

  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    const { owner, repo } = parseRepoUrl(project.repoUrl);

    // Create the issue on GitHub
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      { title, body, labels: labels || [] },
      {
        headers: {
          Authorization: `token ${user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    // Notify project owner
    await sendNotification(
      project.owner,
      'ISSUE_RAISED',
      `⚠️ @${user.username} raised a new issue for "${project.title}": "${title}"`,
      `/projects/${project._id}`
    );

    res.status(201).json({
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      html_url: response.data.html_url,
      state: response.data.state
    });
  } catch (error) {
    console.error("❌ Create GitHub Issue Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to create issue on GitHub." });
  }
});

// 5. Close a GitHub Issue (Owner only)
router.patch("/:id/issues/:issueNumber/close", authenticate, validateObjectId, verifyOwnership, async (req, res) => {
  try {
    const { issueNumber } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    const { owner, repo } = parseRepoUrl(req.project.repoUrl);

    await closeIssue(user.githubAccessToken, owner, repo, issueNumber);

    res.json({ message: `Issue #${issueNumber} closed successfully` });
  } catch (error) {
    console.error("❌ Close GitHub Issue Error:", error.message);
    res.status(500).json({ message: "Failed to close issue on GitHub: " + error.message });
  }
});

// 6. Owner Permissions: Create Labels on GitHub repository
router.post("/:id/labels", authenticate, validateObjectId, verifyOwnership, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: "Label name is required." });

  try {
    const user = await User.findById(req.user.userId);
    const { owner, repo } = parseRepoUrl(req.project.repoUrl);

    const cleanColor = color ? color.replace("#", "") : "6366f1";

    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/labels`,
      { name, color: cleanColor },
      {
        headers: {
          Authorization: `token ${user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        }
      }
    );

    // Save label locally in the Project document
    req.project.labels.push({ name, color: `#${cleanColor}` });
    await req.project.save();

    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to create label: " + error.message });
  }
});

// 7. Owner Permissions: Manage Contributors
router.put("/:id/contributors", authenticate, validateObjectId, verifyOwnership, async (req, res) => {
  const { contributorId, action } = req.body; // action: 'add' or 'remove'
  try {
    if (action === 'add') {
      if (!req.project.contributors.includes(contributorId)) {
        req.project.contributors.push(contributorId);
      }
    } else {
      req.project.contributors = req.project.contributors.filter(id => id.toString() !== contributorId);
    }
    await req.project.save();
    res.json(req.project);
  } catch (error) {
    res.status(500).json({ message: "Failed to manage contributors." });
  }
});

// 8. Owner Permissions: Manage Testers
router.put("/:id/testers", authenticate, validateObjectId, verifyOwnership, async (req, res) => {
  const { testerId, action } = req.body; // action: 'add' or 'remove'
  try {
    if (action === 'add') {
      if (!req.project.testers.includes(testerId)) {
        req.project.testers.push(testerId);
      }
    } else {
      req.project.testers = req.project.testers.filter(id => id.toString() !== testerId);
    }
    await req.project.save();
    res.json(req.project);
  } catch (error) {
    res.status(500).json({ message: "Failed to manage testers." });
  }
});

// 9. Post/Create a project
router.post("/", authenticate, async (req, res) => {
  const { title, description, repoUrl, branchName, difficulty, bounty, requiredSkills, techStack } = req.body;
  const userId = req.user.userId;

  if (!title || !description || !repoUrl || !difficulty) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch initial GitHub stats
    let stars = 0, forks = 0, openIssuesCount = 0;
    try {
      const { owner, repo } = parseRepoUrl(repoUrl);
      const headers = user.githubAccessToken ? { Authorization: `token ${user.githubAccessToken}` } : {};
      const repoDetails = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      stars = repoDetails.data.stargazers_count || 0;
      forks = repoDetails.data.forks_count || 0;
      openIssuesCount = repoDetails.data.open_issues_count || 0;
    } catch (apiError) {
      console.warn("⚠️ Failed to sync repo stats on creation:", apiError.message);
    }

    if (!user.roles.includes('PROJECT_OWNER')) {
      user.roles.push('PROJECT_OWNER');
      await user.save();
    }

    const project = await Project.create({
      title,
      description,
      repoUrl,
      branchName: branchName || 'main',
      difficulty,
      bounty: bounty || 100,
      requiredSkills: requiredSkills || [],
      techStack: techStack || [],
      owner: userId,
      stars,
      forks,
      openIssuesCount
    });

    // Award Platform Pioneer badge and XP if it's their first project
    await awardXP(userId, XP_VALUES.PROJECT_POSTED, 'PROJECT_POSTED');
    await evaluateBadges(user);

    res.status(201).json(project);
  } catch (error) {
    console.error("❌ Create Project Error:", error.message);
    res.status(500).json({ message: "Error creating challenge" });
  }
});

// 10. Get single project base details
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username avatarUrl roles')
      .populate('contributors', 'username avatarUrl')
      .populate('testers', 'username avatarUrl');
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project details" });
  }
});

// 11. Owner Permissions: Edit & Archive Project
router.put("/:id", authenticate, validateObjectId, verifyOwnership, validateProject, async (req, res) => {
  const { title, description, difficulty, status, requiredSkills, techStack, bounty } = req.body;
  try {
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (difficulty) updateFields.difficulty = difficulty;
    if (status) updateFields.status = status;
    if (requiredSkills) updateFields.requiredSkills = requiredSkills;
    if (techStack) updateFields.techStack = techStack;
    if (bounty !== undefined) updateFields.bounty = bounty;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error editing project" });
  }
});

// 12. Accept challenge / auto-fork
router.post("/:id/accept", authenticate, validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isAlreadyAccepted = (user.acceptedProjects || []).some(id => id && id.toString() === project._id.toString());
    if (isAlreadyAccepted) {
      return res.json({ message: "Challenge accepted and fork initiated" });
    }

    try {
      const { owner, repo } = parseRepoUrl(project.repoUrl);
      if (user.githubAccessToken) {
        await forkRepository(user.githubAccessToken, owner, repo);
      }
    } catch (forkError) {
      console.error("❌ Auto-fork failed:", forkError.message);
    }

    if (!user.acceptedProjects) user.acceptedProjects = [];
    user.acceptedProjects.push(project._id);
    await user.save();

    // Notify project owner
    await sendNotification(
      project.owner,
      'CHALLENGE_ACCEPTED',
      `🚀 @${user.username} has accepted your challenge: "${project.title}"!`,
      `/projects/${project._id}`
    );

    res.json({ message: "Challenge accepted and fork initiated" });
  } catch (error) {
    res.status(500).json({ message: "Error accepting challenge: " + error.message });
  }
});

// 13. Delete a project (Owner only)
router.delete("/:id", authenticate, validateObjectId, verifyOwnership, async (req, res) => {
  try {
    const projectId = req.project._id;

    // Remove from acceptedProjects lists
    await User.updateMany(
      { acceptedProjects: projectId },
      { $pull: { acceptedProjects: projectId } }
    );

    // Delete associated submissions
    await Submission.deleteMany({ project: projectId });

    // Delete project
    await Project.findByIdAndDelete(projectId);

    res.json({ message: "Project deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
});

export default router;