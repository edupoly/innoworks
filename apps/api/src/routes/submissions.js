import { Router } from "express";
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { testQueue } from '../lib/queue.js';
import { createPullRequest } from '../lib/github.js';

import { validateObjectId } from '../middleware/validate.js';

const router = Router();

const parseRepoUrl = (url) => {
  const cleanUrl = url.replace(/\/$/, "").replace(/\.git$/, "");
  const parts = cleanUrl.replace("https://github.com/", "").split("/");
  return { owner: parts[0], repo: parts[1] };
};

// Submit work
router.post("/", authenticate, validateObjectId, async (req, res) => {
  const { projectId, forkUrl, branchName } = req.body;
  const userId = req.user.userId;

  if (!projectId || !forkUrl || !branchName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check for existing pending or approved submission
    const existingSubmission = await Submission.findOne({
      project: projectId,
      user: userId,
      status: { $in: ['PENDING', 'TESTING', 'APPROVED'] }
    });

    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted a solution for this project." });
    }

    const user = await User.findById(userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    const submission = await Submission.create({
      project: projectId,
      user: userId,
      forkUrl,
      branchName,
      status: "PENDING",
    });

    // Extract owner and repo from original repoUrl
    try {
      const { owner, repo } = parseRepoUrl(project.repoUrl);
      const head = `${user.username}:${branchName}`;
      
      await createPullRequest(
        user.githubAccessToken,
        owner,
        repo,
        `Submission for: ${project.title}`,
        `This is an automated submission for the mission "${project.title}" by @${user.username}.\n\nFork: ${forkUrl}\nBranch: ${branchName}`,
        head,
        project.branchName || 'main'
      );
    } catch (prError) {
      console.error("❌ Failed to create PR:", prError.message);
    }

    // Add to test queue with error handling
    try {
      await testQueue.add("execute-tests", {
        submissionId: submission._id.toString(),
        repoUrl: forkUrl,
        branchName,
      });
    } catch (queueError) {
      console.error("❌ Failed to add job to queue:", queueError.message);
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ message: "Error creating submission" });
  }
});

// Get submissions for a project
router.get("/project/:projectId", validateObjectId, async (req, res) => {
  try {
    const submissions = await Submission.find({ project: req.params.projectId })
      .populate('user', 'username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

export default router;