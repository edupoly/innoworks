import { Router } from "express";
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { authenticate } from '../middleware/auth.js';
import { forkRepository } from '../lib/github.js';

import { validateObjectId } from '../middleware/validate.js';

const router = Router();

const parseRepoUrl = (url) => {
  const cleanUrl = url.replace(/\/$/, "").replace(/\.git$/, "");
  const parts = cleanUrl.replace("https://github.com/", "").split("/");
  return { owner: parts[0], repo: parts[1] };
};

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('owner', 'username avatarUrl') // Optimized populate
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Create a project
router.post("/", authenticate, async (req, res) => {
  const { title, description, repoUrl, branchName, difficulty, bounty, requiredSkills } =
    req.body;
  const userId = req.user.userId;

  if (!title || !description || !repoUrl || !difficulty) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const project = await Project.create({
      title,
      description,
      repoUrl,
      branchName: branchName || 'main',
      difficulty,
      bounty,
      requiredSkills,
      owner: userId,
    });
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project" });
  }
});

// Get single project
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username avatarUrl');
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project" });
  }
});

// Accept a project
router.post("/:id/accept", authenticate, validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(req.user.userId);
    if (user.acceptedProjects.includes(project._id)) {
      return res.status(400).json({ message: "You have already accepted this challenge" });
    }

    // Trigger fork on GitHub
    try {
      const { owner, repo } = parseRepoUrl(project.repoUrl);
      await forkRepository(user.githubAccessToken, owner, repo);
    } catch (forkError) {
      console.error("❌ Auto-fork failed:", forkError.message);
    }

    user.acceptedProjects.push(project._id);
    await user.save();

    res.json({ message: "Challenge accepted and fork initiated" });
  } catch (error) {
    res.status(500).json({ message: "Error accepting challenge" });
  }
});

// Delete a project
router.delete("/:id", authenticate, validateObjectId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Check ownership
    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only delete your own projects" });
    }

    const projectId = project._id;

    // 1. Remove this project from all users' acceptedProjects arrays
    await User.updateMany(
      { acceptedProjects: projectId },
      { $pull: { acceptedProjects: projectId } }
    );

    // 2. Delete all submissions related to this project
    await Submission.deleteMany({ project: projectId });

    // 3. Delete the project itself
    await Project.findByIdAndDelete(projectId);

    res.json({ message: "Project and associated data deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Project Error:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});

export default router;