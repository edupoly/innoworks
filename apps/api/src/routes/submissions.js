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
  const { projectId, forkUrl } = req.body;
  const branchName = req.body.branchName?.trim();
  const userId = req.user.userId;

  if (!projectId || !forkUrl || !branchName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    // Check for existing submission
    let existingSubmission = await Submission.findOne({
      project: projectId,
      user: userId,
    });

    let submission;
    if (existingSubmission) {
      if (['TESTING', 'APPROVED'].includes(existingSubmission.status)) {
        return res.status(400).json({ message: "You have already submitted a solution that is currently being tested or has been approved." });
      }
      
      // If it's PENDING or REJECTED, allow updating it
      existingSubmission.forkUrl = forkUrl;
      existingSubmission.branchName = branchName;
      existingSubmission.status = "PENDING"; // Reset to pending if it was rejected
      await existingSubmission.save();
      
      console.log(`🔄 Submission updated for user ${user.username} on project ${projectId}`);
      submission = existingSubmission;
    } else {
      submission = await Submission.create({
        project: projectId,
        user: userId,
        forkUrl,
        branchName,
        status: "PENDING",
      });
      console.log(`✅ New submission created for user ${user.username} on project ${projectId}`);
    }

    // Extract owner and repo from original repoUrl and attempt PR creation
    let baseOwner, baseRepo, baseBranch;
    try {
      ({ owner: baseOwner, repo: baseRepo } = parseRepoUrl(project.repoUrl));
      const { owner: headOwner, repo: headRepo } = parseRepoUrl(forkUrl);
      baseBranch = project.branchName || 'main';

      // Determine if this is a submission to the same repository
      const isSameRepo = baseOwner.toLowerCase() === headOwner.toLowerCase() && 
                         baseRepo.toLowerCase() === headRepo.toLowerCase();
      
      const isSameBranch = isSameRepo && branchName === baseBranch;

      // For same-repo PRs, head should just be the branch name. 
      // For cross-repo (fork) PRs, it must be headOwner:branch
      const head = isSameRepo ? branchName : `${headOwner}:${branchName}`;

      if (isSameRepo && isSameBranch) {
        console.log(`ℹ️ Skipping PR creation: User @${user.username} is the project owner and submitting the base branch.`);
      } else {
        await createPullRequest(
          user.githubAccessToken,
          baseOwner,
          baseRepo,
          `Submission for: ${project.title}`,
          `This is an automated submission for the mission "${project.title}" by @${user.username}.\n\nFork: ${forkUrl}\nBranch: ${branchName}`,
          head,
          baseBranch
        );
        console.log(`✅ PR created for @${user.username} from ${headOwner}/${headRepo} to ${baseOwner}/${baseRepo}`);
      }
    } catch (prError) {
      const errorMsg = prError.message || "";
      if (errorMsg.includes("No commits between")) {
        console.log(`ℹ️ Skipping PR creation: ${errorMsg}`);
      } else if (errorMsg.includes("A pull request already exists")) {
        console.log(`ℹ️ PR already exists for @${user.username} on ${baseOwner}/${baseRepo}`);
      } else if (errorMsg.includes("no history in common")) {
        const enhancedError = `The submission branch "${branchName}" has no common history with the project's base branch "${baseBranch}". Please ensure you branched off from "${baseBranch}" when creating your solution.`;
        console.error(`❌ PR History Error: ${enhancedError}`);
        // We can throw this one as it's a clear user error that needs fixing
        return res.status(400).json({ message: enhancedError });
      } else {
        console.error("❌ Failed to create PR:", errorMsg);
      }
      // We don't fail the whole submission for other PR errors, 
      // as the test worker can still run on the forkUrl
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