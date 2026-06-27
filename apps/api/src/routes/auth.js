import { Router } from "express";
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Submission } from '../models/Submission.js';
import { authenticate } from '../middleware/auth.js';
import { getRedisConnection } from '../lib/redis.js';
import { recordLogin } from '../lib/consistency.js';
import { getUserRank } from '../lib/leaderboard.js';

const router = Router();

router.post("/logout", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader.split(" ")[1];
    
    // Decode to get expiry
    const decoded = jwt.decode(token);
    const ttl = decoded.exp ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 86400;

    const redis = getRedisConnection();
    if (redis) {
      await redis.set(`blocklist:${token}`, "true", "EX", ttl);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
    res.status(500).json({ message: "Failed to logout" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-githubAccessToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Record login for streaks
    await recordLogin(user._id);



    // Fetch related data in parallel
    const [submissions, ownedProjects, populatedAccepted, globalRank] = await Promise.all([
      Submission.find({ user: user._id }).populate('project').sort({ createdAt: -1 }),
      Project.find({ owner: user._id }).sort({ createdAt: -1 }),
      Project.find({ 
        _id: { $in: Array.from(new Set((user.acceptedProjects || []).map(id => id.toString()))) },
        status: 'OPEN'
      }).select('title difficulty bounty repoUrl branchName'),
      getUserRank(user._id)
    ]);

    const userData = user.toObject();
    
    // Normalize role for frontend consistency
    if (userData.role) {
      if (userData.role.toUpperCase() === 'ADMIN') userData.role = 'Admin';
      else if (userData.role.toUpperCase() === 'PROJECT_OWNER' || userData.role.toUpperCase() === 'PROJECT OWNER') userData.role = 'Project Owner';
      else if (userData.role.toUpperCase() === 'TEAM') userData.role = 'Team';
      else if (userData.role.toUpperCase() === 'DEVELOPER') userData.role = 'Developer';
    }

    res.json({
      ...userData,
      submissions,
      ownedProjects,
      acceptedProjects: populatedAccepted,
      globalRank
    });
  } catch (error) {
    console.error("❌ Auth Me Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// List user's GitHub repositories
router.get("/repos", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub access token missing" });
    }

    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: {
        sort: "updated",
        per_page: 100,
      },
    });

    const repos = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
    }));

    res.json(repos);
  } catch (error) {
    console.error("Ã¢Å’ GitHub Repos Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch repositories" });
  }
});

// List branches for a specific repository
router.get("/repos/:owner/:repo/branches", authenticate, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub access token missing" });
    }

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `token ${user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const branches = response.data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
    }));

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(branches);
  } catch (error) {
    console.error("Ã¢Å’ GitHub Branches Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch branches" });
  }
});

// Fork a project's repository
router.post("/fork/:projectId", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = await User.findById(req.user.userId);
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ message: "GitHub access token missing" });
    }

    const urlParts = project.repoUrl.replace("https://github.com/", "").split("/");
    const owner = urlParts[0];
    const repo = urlParts[1];

    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/forks`,
      {},
      {
        headers: {
          Authorization: `token ${user.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    res.json({
      message: "Fork initiated",
      forkUrl: response.data.html_url,
      repoFullName: response.data.full_name,
    });
  } catch (error) {
    console.error("Ã¢Å’ GitHub Fork Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fork repository" });
  }
});

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "https://innoworks-api.up.railway.app/auth/github/callback";

router.get("/github", (req, res) => {
  // Use a simple state parameter for CSRF protection
  const state = Math.random().toString(36).substring(7);
  // In a real app, we'd store this in a session or signed cookie
  
  const url =
    `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}` +
    `&scope=user,repo` +
    `&state=${state}`;
  res.redirect(url);
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newToken = jwt.sign({ 
      userId: user.id, 
      role: user.role,
      permissions: user.permissions 
    }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Fetch user repos to populate repositories list & contribution stats
    let repos = [];
    try {
      const reposResponse = await axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${accessToken}` },
        params: { sort: "updated", per_page: 50 }
      });
      repos = reposResponse.data.map(r => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        private: r.private,
        language: r.language
      }));
    } catch (reposErr) {
      console.warn("Ã¢Å¡Â Ã¯Â¸ Failed to pre-fetch repos on login:", reposErr.message);
    }

    // Create or update user in database
    let user = await User.findOneAndUpdate(
      { githubId: githubUser.id.toString() },
      {
        githubUsername: githubUser.login,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        email: githubUser.email,
        githubEmail: githubUser.email,
        githubAccessToken: accessToken,
        githubProfileUrl: githubUser.html_url,
        profileUrl: githubUser.html_url,
        repositories: repos,
        $set: {
          "contributionStats.reposCount": repos.length
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Generate JWT
    const token = jwt.sign({ 
      userId: user.id, 
      role: user.role,
      permissions: user.permissions 
    }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with token
    let frontendUrl = process.env.FRONTEND_URL || "https://innoworks.up.railway.app";
    if (frontendUrl.endsWith("/")) frontendUrl = frontendUrl.slice(0, -1);
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`,
    );
  } catch (error) {
    console.error("Ã¢Å’ GitHub Auth Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? (error.response?.data || error.message) : undefined 
    });
  }
});

export default router;
