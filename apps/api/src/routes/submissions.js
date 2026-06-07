import { Router } from "express";
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { authenticate } from '../middleware/auth.js';
import { testQueue } from '../lib/queue.js';
import { createPullRequest, createPullRequestReview, mergePullRequest, parseRepoUrl } from '../lib/github.js';
import { validateObjectId, validateSubmission } from '../middleware/validate.js';
import { awardXP, XP_VALUES } from '../lib/gamification.js';
import { sendNotification } from '../lib/notifications.js';
import { clearCache } from '../middleware/cache.js';
import axios from 'axios';

const router = Router();

// 1. Get all open submissions that require testing (excluding requester's own)
router.get("/testing/open", authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({
      user: { $ne: req.user.userId },
      status: { $in: ['PENDING', 'TESTING', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] }
    })
    .populate('project', 'title description repoUrl branchName difficulty bounty')
    .populate('user', 'username avatarUrl')
    .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("❌ Get Open Testing Error:", error.message);
    res.status(500).json({ message: "Failed to fetch active testing submissions" });
  }
});

// 2. Solve a challenge (Submit solution)
router.post("/", authenticate, validateObjectId, validateSubmission, async (req, res) => {
  const { projectId, forkUrl, branchName, linkedIssue } = req.body;
  const userId = req.user.userId;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    // Atomic search and state transition using findOneAndUpdate
    const submission = await Submission.findOneAndUpdate(
      { project: projectId, user: userId },
      { 
        $setOnInsert: {
          project: projectId,
          user: userId,
          forkUrl,
          branchName,
          linkedIssue,
          status: "PENDING",
          timeline: [{
            action: "SUBMITTED",
            description: `Challenge accepted and branch "${branchName}" submitted for validation.${linkedIssue ? ` Resolves Issue #${linkedIssue}.` : ''}`,
            actor: userId
          }]
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // If it wasn't a new insert, we need to handle updates carefully
    // Check if the existing submission allows an update
    if (submission.createdAt.getTime() !== submission.updatedAt.getTime()) {
      if (['TESTING', 'APPROVED', 'MERGED'].includes(submission.status)) {
        return res.status(400).json({ message: "You have already submitted a solution that is active or approved." });
      }

      // Perform the update if allowed
      submission.forkUrl = forkUrl;
      submission.branchName = branchName;
      submission.linkedIssue = linkedIssue;
      submission.status = "PENDING";
      submission.timeline.push({
        action: "SUBMITTED",
        description: `Solution updated with branch: ${branchName} on fork.${linkedIssue ? ` Resolves Issue #${linkedIssue}.` : ''}`,
        actor: userId
      });
      await submission.save();
    }

    // Auto-create PR on GitHub with CRITICAL PR CREATION FIX (Prevents 422 Errors)
    let baseOwner, baseRepo, baseBranch;
    try {
      ({ owner: baseOwner, repo: baseRepo } = parseRepoUrl(project.repoUrl));
      const { owner: headOwner, repo: headRepo } = parseRepoUrl(forkUrl);
      baseBranch = project.branchName || 'main';

      const isSameRepo = baseOwner.toLowerCase() === headOwner.toLowerCase() && baseRepo.toLowerCase() === headRepo.toLowerCase();
      
      // Ensure head is formatted as forkOwner:branchName for forks
      const head = isSameRepo ? branchName : `${headOwner}:${branchName}`;

      console.log(`🔍 Executing Critical PR Creation Validations for @${user.username}: base=${baseOwner}/${baseRepo}:${baseBranch}, head=${head}`);

      // 1. Verify Repository Exists and User has Access
      try {
        await axios.get(`https://api.github.com/repos/${headOwner}/${headRepo}`, {
          headers: { Authorization: `token ${user.githubAccessToken}` }
        });
      } catch (err) {
        if (err.response?.status === 404) {
          throw new Error(`Repository "${headOwner}/${headRepo}" not found. If this is a fork, please ensure it was created correctly on GitHub.`);
        }
        throw new Error(`Failed to access repository "${headOwner}/${headRepo}": ${err.message}`);
      }

      // 2. Verify Working Branch Exists
      try {
        await axios.get(`https://api.github.com/repos/${headOwner}/${headRepo}/branches/${branchName}`, {
          headers: { Authorization: `token ${user.githubAccessToken}` }
        });
      } catch (err) {
        throw new Error(`Working branch "${branchName}" not found in repository "${headOwner}/${headRepo}". Please push your code before submitting.`);
      }

      // 3. Verify Branch Has Commits (Compare base branch with head branch)
      try {
        // Use the appropriate compare URL based on whether it's a fork or same repo
        const compareUrl = isSameRepo 
          ? `https://api.github.com/repos/${baseOwner}/${baseRepo}/compare/${baseBranch}...${branchName}`
          : `https://api.github.com/repos/${baseOwner}/${baseRepo}/compare/${baseBranch}...${headOwner}:${branchName}`;

        const compareResponse = await axios.get(compareUrl, { 
          headers: { Authorization: `token ${user.githubAccessToken}` } 
        });
        
        const totalCommits = compareResponse.data.total_commits || 0;
        if (totalCommits === 0 && !isSameRepo) {
          throw new Error(`Your working branch "${branchName}" has no commits compared to the project's base branch "${baseBranch}". Please make commits and push before submitting.`);
        }
      } catch (err) {
        if (err.message.includes("no commits")) throw err;
        console.warn("⚠️ Branch compare skipped (non-critical):", err.message);
      }

      // 4. Create Pull Request
      if (isSameRepo && branchName === baseBranch) {
        console.log("ℹ_ Skipping PR creation: Owner submitting base branch directly.");
      } else {
        const pr = await createPullRequest(
          user.githubAccessToken,
          baseOwner,
          baseRepo,
          `Submission for: ${project.title}`,
          `This is an automated submission for the mission "${project.title}" by @${user.username}.\n\nFork: ${forkUrl}\nBranch: ${branchName}${linkedIssue ? `\n\nResolves #${linkedIssue}` : ""}`,
          head,
          baseBranch
        );
        
        submission.prNumber = pr.number;
        submission.prUrl = pr.html_url;
        submission.status = "UNDER_REVIEW";
        await submission.save();

        // Notify Project Owner
        await sendNotification(
          project.owner,
          'PR_CREATED',
          `📬 Developer @${user.username} submitted a solution for "${project.title}"! Automated PR #${pr.number} created.`,
          `/projects/${project._id}`
        );
      }
    } catch (prError) {
      console.warn("⚠️ GitHub PR Creation skipped/failed:", prError.message);
      // Only delete if it was a brand new submission (created and updated at the same time)
      if (submission && submission.createdAt.getTime() === submission.updatedAt.getTime()) {
        await Submission.findByIdAndDelete(submission._id);
      }
      return res.status(400).json({ message: prError.message || "Pull request creation validation failed on GitHub" });
    }

    // Add to Redis Queue for testing
    try {
      await testQueue.add("execute-tests", {
        submissionId: submission._id.toString(),
        repoUrl: forkUrl,
        branchName,
      });
    } catch (queueError) {
      console.error("❌ Redis queue addition failed:", queueError.message);
    }

    res.status(201).json(submission);

    // Notify project owner about new submission
    await sendNotification(
      project.owner,
      'NEW_SUBMISSION',
      `💎 @${user.username} submitted a solution for "${project.title}"!`,
      `/projects/${project._id}`
    );

    // Clear caches
    clearCache(`/projects/${projectId}`);
    clearCache('/projects');
  } catch (error) {
    console.error("❌ Submission Error:", error.message);
    res.status(500).json({ message: "Error creating submission: " + error.message });
  }
});

// 3. Get submissions for a project
router.get("/project/:projectId", validateObjectId, async (req, res) => {
  try {
    const submissions = await Submission.find({ project: req.params.projectId })
      .populate('user', 'username avatarUrl')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'username avatarUrl'
        }
      })
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

// 4. Get a single submission details (including timeline and reviews)
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('project')
      .populate('user', 'username avatarUrl role bio skills xp level reputationScore badges')
      .populate({
        path: 'timeline.actor',
        select: 'username avatarUrl'
      });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Fetch related reviews
    const reviews = await Review.find({ submission: submission._id })
      .populate('reviewer', 'username avatarUrl');

    res.json({ submission, reviews });
  } catch (error) {
    res.status(500).json({ message: "Error fetching submission details" });
  }
});

// 5. Submit a tester peer review
router.post("/:id/reviews", authenticate, async (req, res) => {
  const { feedback, outcome, checklist, rating, bugsFound, suggestions } = req.body;
  const reviewerId = req.user.userId;

  if (!feedback || !outcome) {
    return res.status(400).json({ message: "Missing feedback or outcome" });
  }

  try {
    let submission;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      submission = await Submission.findById(req.params.id).populate('project');
    } else {
      submission = await Submission.findOne({ prNumber: parseInt(req.params.id) }).populate('project');
      
      // If not found, it might be a GitHub PR not yet synced
      if (!submission) {
        console.log(`🔍 Submission not found for PR #${req.params.id}. Attempting to sync from GitHub...`);
        // We need the project to know where to look
        // The frontend should probably pass projectId in the body if it's a PR review for a non-existing submission
        const { projectId } = req.body;
        if (projectId) {
          const project = await Project.findById(projectId);
          if (project) {
            const { owner, repo } = parseRepoUrl(project.repoUrl);
            const user = await User.findById(reviewerId);
            
            try {
              const { data: prData } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${req.params.id}`, {
                headers: { Authorization: `token ${user.githubAccessToken}` }
              });
              
              // Find the author in our system
              const author = await User.findOne({ username: prData.user.login });
              if (author) {
                submission = await Submission.create({
                  project: project._id,
                  user: author._id,
                  prNumber: prData.number,
                  prUrl: prData.html_url,
                  forkUrl: prData.head.repo.html_url,
                  branchName: prData.head.ref,
                  status: 'UNDER_REVIEW',
                  timeline: [{
                    action: 'SUBMITTED',
                    description: 'Imported from GitHub PR.',
                    actor: author._id
                  }]
                });
                submission.project = project; // For population consistency
                console.log(`✅ Automatically created submission for imported PR #${prData.number}`);
              }
            } catch (err) {
              console.warn("⚠️ Failed to sync PR from GitHub:", err.message);
            }
          }
        }
      }
    }

    if (!submission) return res.status(404).json({ message: "Submission not found or could not be synced from GitHub. Please ensure the PR author is registered on the Innoworks." });

    if (submission.user.toString() === reviewerId) {
      return res.status(400).json({ message: "You cannot review your own submission" });
    }

    const reviewerUser = await User.findById(reviewerId);
    if (!reviewerUser) return res.status(404).json({ message: "Reviewer profile not found" });

    // Create review report
    const review = await Review.create({
      submission: submission._id,
      reviewer: reviewerId,
      checklist: checklist || [],
      feedback,
      outcome,
      rating: rating || 5,
      bugsFound: bugsFound || [],
      suggestions: suggestions || ""
    });

    // Sync to GitHub if prNumber exists
    if (submission.prNumber && reviewerUser.githubAccessToken) {
      try {
        const { owner, repo } = parseRepoUrl(submission.project.repoUrl);
        const githubEvent = outcome === 'APPROVED' ? 'APPROVE' : (outcome === 'NEEDS_CHANGES' ? 'REQUEST_CHANGES' : 'COMMENT');
        
        let githubBody = `### Peer Review from Innoworks\n\n**Outcome:** ${outcome}\n**Rating:** ${rating || 'N/A'}/5\n\n${feedback}`;
        
        if (bugsFound && bugsFound.length > 0) {
          githubBody += `\n\n**Bugs Found:**\n${bugsFound.map(b => `- ${b}`).join('\n')}`;
        }
        
        if (suggestions) {
          githubBody += `\n\n**Suggestions:**\n${suggestions}`;
        }

        const ghReview = await createPullRequestReview(
          reviewerUser.githubAccessToken,
          owner,
          repo,
          submission.prNumber,
          githubEvent,
          githubBody
        );

        if (ghReview && ghReview.id) {
          review.githubReviewId = ghReview.id;
          await review.save();
        }
      } catch (ghError) {
        console.warn("⚠️ Failed to sync review to GitHub:", ghError.message);
      }
    }

    // Update submission status based on outcome
    let nextStatus = 'PENDING';
    let timelineAction = 'REVIEW_ADDED';
    if (outcome === 'APPROVED') {
      nextStatus = 'APPROVED';
      timelineAction = 'APPROVED';
    } else if (outcome === 'NEEDS_CHANGES') {
      nextStatus = 'CHANGES_REQUESTED';
      timelineAction = 'CHANGES_REQUESTED';
    } else if (outcome === 'REJECTED') {
      nextStatus = 'REJECTED';
      timelineAction = 'REJECTED';
    }

    submission.status = nextStatus;
    submission.timeline.push({
      action: timelineAction,
      description: `Peer review completed by @${reviewerUser.username} with outcome: "${outcome}".`,
      actor: reviewerId
    });
    await submission.save();

    // Award XP to the developer if approved
    if (outcome === 'APPROVED') {
      await awardXP(submission.user, XP_VALUES.PR_APPROVED, 'PR_APPROVED');
    }

    // Award XP to reviewer for testing contribution! (30 XP)
    await awardXP(reviewerId, XP_VALUES.TESTING_REVIEW, 'TESTING_REVIEW');

    // Notify developer
    await sendNotification(
      submission.user,
      outcome === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
      `🕵️ Peer review completed for your submission in "${submission.project.title}" by @${reviewerUser.username}. Outcome: ${outcome}.`,
      `/dashboard`
    );

    // Clear caches
    clearCache(`/projects/${submission.project._id}`);
    clearCache(`/users/profile/${reviewerUser.username}`);
    const devUser = await User.findById(submission.user);
    if (devUser) clearCache(`/users/profile/${devUser.username}`);
    clearCache('/users/leaderboard');
    clearCache('/projects');

    res.status(201).json(review);
  } catch (error) {
    console.error("❌ Submit Peer Review Error:", error.message);
    res.status(500).json({ message: "Failed to submit review: " + error.message });
  }
});

// 6. Get reviews for a submission
router.get("/:id/reviews", validateObjectId, async (req, res) => {
  try {
    const reviews = await Review.find({ submission: req.params.id })
      .populate('reviewer', 'username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// 7. Merge a submission (Project Owner or Admin)
router.post("/:id/merge", authenticate, validateObjectId, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('project');
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Verify project ownership or Admin role
    const isOwner = submission.project.owner.toString() === req.user.userId;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project owner or an Admin can merge submissions" });
    }

    if (submission.status === 'MERGED') {
      return res.status(400).json({ message: "This submission has already been merged." });
    }

    if (!submission.prNumber) {
      return res.status(400).json({ message: "This submission does not have an associated GitHub PR." });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    const { owner, repo } = parseRepoUrl(submission.project.repoUrl);
    
    // Merge on GitHub
    await mergePullRequest(
      user.githubAccessToken,
      owner,
      repo,
      submission.prNumber,
      `Merge contribution from @${submission.user.username}`,
      `Merged via Innoworks: ${submission.project.title}`
    );

    // Update local status
    submission.status = 'MERGED';
    submission.timeline.push({
      action: 'MERGED',
      description: `Submission merged into the base branch by ${isAdmin ? 'Admin' : 'Owner'}.`,
      actor: req.user.userId
    });
    await submission.save();

    // Award XP to contributor (200 XP for merged contribution)
    await awardXP(submission.user, XP_VALUES.PR_MERGED, 'PR_MERGED');

    // Notify developer
    await sendNotification(
      submission.user,
      'PR_MERGED',
      `🎊 Your contribution for "${submission.project.title}" has been merged! Congratulations!`,
      `/dashboard`
    );

    // Clear caches
    clearCache(`/projects/${submission.project._id}`);
    const mergedUser = await User.findById(submission.user);
    if (mergedUser) clearCache(`/users/profile/${mergedUser.username}`);
    clearCache('/users/leaderboard');
    clearCache('/projects');

    res.json({ message: "Submission merged successfully." });
  } catch (error) {
    console.error("❌ Merge Error:", error.message);
    res.status(500).json({ message: "Failed to merge contribution: " + error.message });
  }
});

// 8. Reject a submission (Project Owner or Admin)
router.post("/:id/reject", authenticate, validateObjectId, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('project');
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Verify project ownership or Admin role
    const isOwner = submission.project.owner.toString() === req.user.userId;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project owner or an Admin can reject submissions" });
    }

    if (!submission.prNumber) {
      return res.status(400).json({ message: "This submission does not have an associated GitHub PR." });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub authentication required" });
    }

    const { owner, repo } = parseRepoUrl(submission.project.repoUrl);
    
    // Close on GitHub
    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${submission.prNumber}`,
      { state: 'closed' },
      {
        headers: {
          Authorization: `token ${user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    // Update local status
    submission.status = 'REJECTED';
    submission.timeline.push({
      action: 'REJECTED',
      description: `Submission rejected and PR closed by ${isAdmin ? 'Admin' : 'Owner'}.`,
      actor: req.user.userId
    });
    await submission.save();

    // Notify developer
    await sendNotification(
      submission.user,
      'REVIEW_REJECTED',
      `❌ Your contribution for "${submission.project.title}" has been closed/rejected by the ${isAdmin ? 'Admin' : 'maintainer'}.`,
      `/dashboard`
    );

    // Clear caches
    clearCache(`/projects/${submission.project._id}`);
    clearCache('/projects');

    res.json({ message: "Submission rejected and closed successfully." });
  } catch (error) {
    console.error("❌ Reject Error:", error.message);
    res.status(500).json({ message: "Failed to reject contribution: " + error.message });
  }
});

export default router;