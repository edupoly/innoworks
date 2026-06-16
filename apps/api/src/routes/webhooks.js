import { Router } from "express";
import { githubApp } from '../lib/github.js';
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Issue } from '../models/Issue.js';
import { Evaluation } from '../models/Evaluation.js';
import { awardXP, XP_VALUES } from '../lib/gamification.js';
import { recordActivity } from '../lib/consistency.js';
import { sendNotification } from '../lib/notifications.js';
import { clearCache } from '../middleware/cache.js';

const router = Router();

// Helper to prevent ReDoS by escaping regex metacharacters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Handle webhook event verification
router.post("/", async (req, res) => {
  if (!githubApp) {
    return res.status(503).json({ message: "GitHub features are currently disabled" });
  }

  try {
    const id = req.headers["x-github-delivery"];
    const name = req.headers["x-github-event"];
    const signature = req.headers["x-hub-signature-256"];
    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    await githubApp.webhooks.verifyAndReceive({
      id,
      name,
      signature,
      payload,
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook Signature Error:", error.message);
    res.status(500).json({ message: "Webhook execution failed" });
  }
});

// Configure Webhook Events
if (githubApp) {
  // 1. Push Event Handler (Updates Commits Count and Activity)
  githubApp.webhooks.on("push", async ({ payload }) => {
    const repoUrl = payload.repository.html_url;
    console.log(`📡 GitHub Push Webhook: repo=${repoUrl}, ref=${payload.ref}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      // Update basic repository counts
      project.stars = payload.repository.stargazers_count || project.stars;
      project.forks = payload.repository.forks_count || project.forks;
      await project.save();

      // Check if any commits modified the wiki/ folder
      const wikiModified = payload.commits.some(commit => 
        (commit.added || []).some(f => f.startsWith('wiki/')) ||
        (commit.modified || []).some(f => f.startsWith('wiki/')) ||
        (commit.removed || []).some(f => f.startsWith('wiki/'))
      );

      if (wikiModified) {
        console.log(`📡 Wiki folder modification detected in push to ${project.title}`);
        // We can't easily sync here without a user token, but we can clear cache 
        // and let the next GET request trigger the sync in wiki.js
        clearCache(`/projects/${project._id}/wiki`);
      }

      // Clear caches
      clearCache(`/projects/${project._id}`);
      clearCache('/projects');

      // Broadcast Socket.IO notifications for new commits if any
      const branchName = payload.ref.replace("refs/heads/", "");
      if (branchName === project.branchName) {
        payload.commits.forEach(commit => {
          sendNotification(
            project.owner,
            'COMMENT_ADDED',
            `🔨 Code pushed to ${project.title}: "${commit.message}" by @${commit.author.username || commit.author.name}`,
            `/projects/${project._id}`
          );
        });
      }
    } catch (err) {
      console.error("❌ Webhook Push error:", err.message);
    }
  });

  // 2. Issues Event Handler (Created, Assigned, Closed)
  githubApp.webhooks.on("issues", async ({ payload }) => {
    const action = payload.action;
    const issueNum = payload.issue.number;
    const repoUrl = payload.repository.html_url;
    console.log(`📡 GitHub Issue Webhook: action=${action}, repo=${repoUrl}, issue=${issueNum}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      // Update open issues count
      project.openIssuesCount = payload.repository.open_issues_count || project.openIssuesCount;
      await project.save();

      // Clear caches
      clearCache(`/projects/${project._id}`);

      // Notify Owner or Assigned users
      if (action === "opened") {
        const creator = await User.findOne({ username: payload.issue.user.login });
        if (creator) {
          await recordActivity(creator._id, 'ISSUE_CREATED');
        }

        await sendNotification(
          project.owner,
          'ISSUE_CREATED',
          `📝 New issue #${issueNum} opened in your challenge: "${payload.issue.title}"`,
          `/projects/${project._id}`
        );
      } else if (action === "assigned") {
        const assigneeLogin = payload.assignee.login;
        const assigneeUser = await User.findOne({ username: assigneeLogin });
        if (assigneeUser) {
          await sendNotification(
            assigneeUser._id,
            'ISSUE_ASSIGNED',
            `🎯 You've been assigned to issue #${issueNum} in "${project.title}" on GitHub.`,
            `/dashboard`
          );
        }
      }
    } catch (err) {
      console.error("❌ Webhook Issues error:", err.message);
    }
  });

  // 3. Issue Comment Event Handler (Comment Added)
  githubApp.webhooks.on("issue_comment", async ({ payload }) => {
    const action = payload.action;
    const repoUrl = payload.repository.html_url;
    const commentBody = payload.comment.body;
    const commentAuthor = payload.comment.user.login;

    if (action !== "created") return;

    console.log(`📡 GitHub Issue Comment Webhook: repo=${repoUrl}, author=${commentAuthor}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      // Find if this comment relates to a pull request submission
      const prNumber = payload.issue.number;
      const submission = await Submission.findOne({
        project: project._id,
        prNumber: prNumber
      }).populate('user');

      if (submission) {
        // Log comment inside the timeline
        submission.timeline.push({
          action: "REVIEW_ADDED",
          description: `@${commentAuthor} left a comment on the pull request: "${commentBody.slice(0, 60)}..."`
        });
        await submission.save();

        // Notify developer
        await sendNotification(
          submission.user._id,
          'COMMENT_ADDED',
          `💬 New comment on PR #${prNumber} by @${commentAuthor}: "${commentBody.slice(0, 50)}..."`,
          `/dashboard`
        );
      }
    } catch (err) {
      console.error("❌ Webhook Comment error:", err.message);
    }
  });

  // 4. Pull Request Event Handler (Opened, Closed, Merged)
  githubApp.webhooks.on("pull_request", async ({ payload }) => {
    const action = payload.action;
    const prNumber = payload.pull_request.number;
    const prUrl = payload.pull_request.html_url;
    const repoUrl = payload.repository.html_url;
    const isMerged = payload.pull_request.merged;

    console.log(`📡 GitHub PR Webhook: action=${action}, repo=${repoUrl}, pr=${prNumber}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      const headBranch = payload.pull_request.head.ref;
      let submission = await Submission.findOne({
        project: project._id,
        $or: [
          { prNumber: prNumber },
          { branchName: headBranch }
        ]
      }).populate('user');

      // Clear caches early for visibility
      clearCache(`/projects/${project._id}`);

      // Method 2: External PR Detection (PR opened externally using Git CLI / Website)
      if (!submission && action === "opened") {
        const prCreator = payload.pull_request.user.login;
        const developer = await User.findOne({ username: prCreator });

        if (developer) {
          submission = await Submission.create({
            project: project._id,
            user: developer._id,
            forkUrl: payload.pull_request.head.repo?.html_url || repoUrl,
            branchName: headBranch,
            prNumber: prNumber,
            prUrl: prUrl,
            status: "UNDER_REVIEW",
            timeline: [{
              action: "SUBMITTED",
              description: `External PR #${prNumber} detected via webhooks. Solution linked.`,
              actor: developer._id
            }]
          });
          console.log(`✅ External PR Contribution created for @${prCreator}`);
        }
      }

      if (!submission) return;

      submission.prNumber = prNumber;
      submission.prUrl = prUrl;

      if (action === "opened" || action === "reopened" || action === "synchronize") {
        submission.status = "UNDER_REVIEW";
        submission.timeline.push({
          action: "SUBMITTED",
          description: action === "synchronize" 
            ? `New commits pushed to PR #${prNumber}. Review and tests re-queued.`
            : `Pull request #${prNumber} opened on GitHub. Review queued.`,
          actor: submission.user._id
        });
        await submission.save();

        // Increment user PR count only on initial open
        if (action === "opened") {
          await User.findByIdAndUpdate(submission.user._id, { $inc: { "contributionStats.prsCount": 1 } });
        }

        // Trigger testing if it's a code change
        // In a real system, we'd add it back to BullMQ queue here
        // For now, clear caches and notify owner
        clearCache(`/projects/${project._id}`);

        await sendNotification(
          project.owner,
          'PR_CREATED',
          action === "synchronize"
            ? `🔄 PR #${prNumber} for "${project.title}" was updated with new commits by @${submission.user.username}.`
            : `📬 New PR #${prNumber} raised for your challenge "${project.title}" by @${submission.user.username}.`,
          `/projects/${project._id}`
        );
      } 
      
      else if (action === "closed" && isMerged) {
        if (submission.xpAwarded.includes('PR_MERGED')) {
          console.log(`📡 PR #${prNumber} already awarded PR_MERGED XP. Skipping.`);
          return;
        }

        submission.status = "MERGED";
        submission.timeline.push({
          action: "MERGED",
          description: `Pull Request #${prNumber} merged successfully into default branch.`,
          actor: submission.user._id
        });
        
        submission.xpAwarded.push('PR_MERGED');
        await submission.save();

        // Add contributor to project contributors array if not present
        const contributors = project.contributors || [];
        if (!contributors.includes(submission.user._id)) {
          project.contributors = [...contributors, submission.user._id];
          project.contributorsCount = project.contributors.length;
          await project.save();
        }

        // Award Merged XP! (200 XP)
        await awardXP(submission.user._id, XP_VALUES.PR_MERGED, 'PR_MERGED');

        // Create Pending Evaluation for Project Owner
        await Evaluation.create({
          contributor: submission.user._id,
          evaluator: project.owner,
          project: project._id,
          submission: submission._id,
          type: 'GITHUB_MERGE',
          categories: { codeQuality: 1, refactoring: 1, performance: 1, collaboration: 1 },
          overallScore: 0,
          isPending: true
        });
        
        // Clear caches on merge
        clearCache(`/users/profile/${submission.user.username}`);
        clearCache('/users/leaderboard');
        clearCache('/projects');

        await sendNotification(
          submission.user._id,
          'PR_MERGED',
          `🏆 Great job! Your solution for "${project.title}" was merged on GitHub! (+200 XP)`,
          `/dashboard`
        );
      } 
      
      else if (action === "closed" && !isMerged) {
        submission.status = "REJECTED";
        submission.timeline.push({
          action: "REJECTED",
          description: `Pull Request #${prNumber} was closed on GitHub without being merged.`,
          actor: submission.user._id
        });
        await submission.save();

        await sendNotification(
          submission.user._id,
          'REVIEW_REJECTED',
          `❌ Your pull request #${prNumber} was closed on GitHub without being merged.`,
          `/dashboard`
        );
      }
    } catch (err) {
      console.error("❌ Webhook PR processing failed:", err.message);
    }
  });

  // 5. Pull Request Review Event Handler
  githubApp.webhooks.on("pull_request_review", async ({ payload }) => {
    const action = payload.action;
    const prNumber = payload.pull_request.number;
    const repoUrl = payload.repository.html_url;
    const state = payload.review.state; // 'approved', 'changes_requested', 'commented'
    const feedback = payload.review.body || "No feedback left.";
    const reviewerUsername = payload.review.user.login;

    if (action !== "submitted") return;

    console.log(`📡 GitHub PR Review Webhook: repo=${repoUrl}, pr=${prNumber}, state=${state}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      const submission = await Submission.findOne({
        project: project._id,
        prNumber: prNumber
      }).populate('user');

      if (!submission) return;

      // Check for existing review by ID to prevent duplication
      const existingReview = await Review.findOne({ githubReviewId: payload.review.id });
      if (existingReview) {
        console.log(`📡 Skipping duplicate review webhook for PR #${prNumber}`);
        return;
      }

      // Clear project cache
      clearCache(`/projects/${project._id}`);

      const reviewer = await User.findOne({ username: reviewerUsername });
      const reviewerId = reviewer ? reviewer._id : project.owner;

      let outcome = "APPROVED";
      let timelineAction = "APPROVED";
      let status = "APPROVED";
      let msg = `🎉 Your submission for "${project.title}" has been approved!`;

      if (state === "changes_requested") {
        outcome = "NEEDS_CHANGES";
        timelineAction = "CHANGES_REQUESTED";
        status = "CHANGES_REQUESTED";
        msg = `⚠️ Changes requested on your pull request for "${project.title}"`;
      }

      submission.status = status;
      submission.timeline.push({
        action: timelineAction,
        description: `Review submitted by @${reviewerUsername}: "${state.replace('_', ' ')}".`,
        actor: reviewerId
      });

      // Award XP to the developer if approved (only once)
      if (state === "approved" && !submission.xpAwarded.includes('PR_APPROVED')) {
        await awardXP(submission.user._id, XP_VALUES.PR_APPROVED, 'PR_APPROVED');
        submission.xpAwarded.push('PR_APPROVED');
      }

      await submission.save();

      // Create Local Review Report (using upsert/id)
      await Review.create({
        submission: submission._id,
        reviewer: reviewerId,
        feedback: feedback,
        outcome: outcome,
        githubReviewId: payload.review.id
      });

      // Award XP to reviewer (30 XP)
      if (reviewer) {
        await awardXP(reviewer._id, XP_VALUES.TESTING_REVIEW, 'TESTING_REVIEW');
        clearCache(`/users/profile/${reviewer.username}`);
        clearCache('/users/leaderboard');
      }

      await sendNotification(
        submission.user._id,
        state === "approved" ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
        msg,
        `/dashboard`
      );
    } catch (err) {
      console.error("❌ Webhook Review processing failed:", err.message);
    }
  });

  // 6. PR Review Comment Event (Comment Added to review)
  githubApp.webhooks.on("pull_request_review_comment", async ({ payload }) => {
    const action = payload.action;
    const prNumber = payload.pull_request.number;
    const repoUrl = payload.repository.html_url;
    const commentBody = payload.comment.body;
    const author = payload.comment.user.login;

    if (action !== "created") return;

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      const submission = await Submission.findOne({
        project: project._id,
        prNumber: prNumber
      }).populate('user');

      if (submission) {
        submission.timeline.push({
          action: "REVIEW_ADDED",
          description: `@${author} commented on diff: "${commentBody.slice(0, 50)}..."`
        });
        await submission.save();

        await sendNotification(
          submission.user._id,
          'COMMENT_ADDED',
          `💬 New inline PR comment by @${author}: "${commentBody.slice(0, 50)}..."`,
          `/dashboard`
        );
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 7. Releases Event Handler
  githubApp.webhooks.on("release", async ({ payload }) => {
    const repoUrl = payload.repository.html_url;
    const relName = payload.release.name || payload.release.tag_name;
    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      // Notify owner and developer team of new release
      await sendNotification(
        project.owner,
        'COMMENT_ADDED',
        `🚀 New release "${relName}" published for repository ${project.title}!`,
        `/projects/${project._id}`
      );
    } catch (err) {
      console.error(err);
    }
  });

  // 8. Star Event Handler
  githubApp.webhooks.on("star", async ({ payload }) => {
    const repoUrl = payload.repository.html_url;
    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      project.stars = payload.repository.stargazers_count;
      await project.save();
    } catch (err) {
      console.error("❌ Webhook Star error:", err.message);
    }
  });

  // 9. Fork Event Handler
  githubApp.webhooks.on("fork", async ({ payload }) => {
    const repoUrl = payload.repository.html_url;
    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      project.forks = payload.repository.forks_count;
      await project.save();
    } catch (err) {
      console.error("❌ Webhook Fork error:", err.message);
    }
  });

  // 10. Wiki Event Handler (Official GitHub Wiki)
  githubApp.webhooks.on("gollum", async ({ payload }) => {
    const repoUrl = payload.repository.html_url;
    console.log(`📡 GitHub Wiki (Gollum) Webhook: repo=${repoUrl}`);

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      // Clear wiki caches
      clearCache(`/projects/${project._id}/wiki`);
      
      payload.pages.forEach(page => {
        sendNotification(
          project.owner,
          'COMMENT_ADDED',
          `📖 Wiki page "${page.title}" was ${page.action} on GitHub.`,
          `/projects/${project._id}/wiki/${page.page_name}`
        );
      });
    } catch (err) {
      console.error("❌ Webhook Gollum error:", err.message);
    }
  });

  // 11. Issues Event Handler
  githubApp.webhooks.on("issues", async ({ payload }) => {
    const action = payload.action;
    const issueNumber = payload.issue.number;
    const repoUrl = payload.repository.html_url;

    try {
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(`^${escapeRegex(repoUrl)}/?$`, 'i') } });
      if (!project) return;

      if (action === "opened") {
        await Issue.create({
          title: payload.issue.title,
          description: payload.issue.body || '',
          project: project._id,
          githubIssueNumber: issueNumber,
          githubIssueUrl: payload.issue.html_url,
          githubAuthor: {
            username: payload.issue.user.login,
            avatarUrl: payload.issue.user.avatar_url
          },
          githubState: 'OPEN',
          status: 'Open',
          author: project.owner // Default to project owner if created externally
        });
      } else if (action === "closed" || action === "reopened") {
        await Issue.findOneAndUpdate(
          { project: project._id, githubIssueNumber: issueNumber },
          { 
            githubState: action === 'closed' ? 'CLOSED' : 'OPEN',
            status: action === 'closed' ? 'Closed' : 'Open'
          }
        );
      }
      
      // Clear issue caches
      clearCache(`/issues/${project._id}`);
    } catch (err) {
      console.error("❌ Webhook Issues error:", err.message);
    }
  });
}

export default router;
