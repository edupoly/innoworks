import { Router } from "express";
import { githubApp } from '../lib/github.js';
import { Submission } from '../models/Submission.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { awardXP, XP_VALUES } from '../lib/gamification.js';
import { sendNotification } from '../lib/notifications.js';

const router = Router();

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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
      if (!project) return;

      // Update basic repository counts
      project.stars = payload.repository.stargazers_count || project.stars;
      project.forks = payload.repository.forks_count || project.forks;
      await project.save();

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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
      if (!project) return;

      // Update open issues count
      project.openIssuesCount = payload.repository.open_issues_count || project.openIssuesCount;
      await project.save();

      // Notify Owner or Assigned users
      if (action === "opened") {
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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
      if (!project) return;

      const headBranch = payload.pull_request.head.ref;
      let submission = await Submission.findOne({
        project: project._id,
        $or: [
          { prNumber: prNumber },
          { branchName: headBranch }
        ]
      }).populate('user');

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

      // Update PR metadata
      submission.prNumber = prNumber;
      submission.prUrl = prUrl;

      if (action === "opened" || action === "reopened") {
        submission.status = "UNDER_REVIEW";
        submission.timeline.push({
          action: "SUBMITTED",
          description: `Pull request #${prNumber} opened on GitHub. Review queued.`,
          actor: submission.user._id
        });
        await submission.save();

        // Increment user PR count
        if (action === "opened") {
          await User.findByIdAndUpdate(submission.user._id, { $inc: { "contributionStats.prsCount": 1 } });
        }

        await sendNotification(
          project.owner,
          'PR_CREATED',
          `📬 New PR #${prNumber} raised for your challenge "${project.title}" by @${submission.user.username}.`,
          `/projects/${project._id}`
        );
      } 
      
      else if (action === "closed" && isMerged) {
        submission.status = "MERGED";
        submission.timeline.push({
          action: "MERGED",
          description: `Pull Request #${prNumber} merged successfully into default branch.`,
          actor: submission.user._id
        });
        await submission.save();

        // Add contributor to project contributors array if not present
        if (!project.contributors.includes(submission.user._id)) {
          project.contributors.push(submission.user._id);
          project.contributorsCount += 1;
          await project.save();
        }

        // Award Merged XP! (200 XP)
        await awardXP(submission.user._id, XP_VALUES.PR_MERGED, 'PR_MERGED');
        
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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
      if (!project) return;

      const submission = await Submission.findOne({
        project: project._id,
        prNumber: prNumber
      }).populate('user');

      if (!submission) return;

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
      await submission.save();

      // Create Local Review Report
      await Review.create({
        submission: submission._id,
        reviewer: reviewerId,
        feedback: feedback,
        outcome: outcome
      });

      // Award XP to reviewer if tester (30 XP)
      if (reviewer && reviewer.roles.includes('TESTER')) {
        await awardXP(reviewer._id, XP_VALUES.TESTING_REVIEW, 'TESTING_REVIEW');
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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
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
      const project = await Project.findOne({ repoUrl: { $regex: new RegExp(repoUrl, 'i') } });
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
}

export default router;
