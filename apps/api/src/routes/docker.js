import { Router } from "express";
import { Project } from '../models/Project.js';
import { ApprovalRequest } from '../models/ApprovalRequest.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';

const router = Router();

/**
 * POST /docker/:projectId/upload
 * Upload a Docker asset (Team or higher)
 */
router.post("/:projectId/upload", authenticate, authorize('Team'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filename, url, assetType } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const asset = {
      filename,
      url,
      assetType,
      uploadedBy: req.user.userId,
      status: 'Pending'
    };

    project.dockerAssets.push(asset);
    await project.save();

    // Create approval request
    const request = await ApprovalRequest.create({
      type: 'Docker',
      referenceId: project._id, // Reference the project, asset index can be used in metadata
      project: projectId,
      requestedBy: req.user.userId,
      changeSummary: `Uploaded ${assetType}: ${filename}`
    });

    await logAudit(req, 'UPLOAD_DOCKER_ASSET', 'Project', projectId, { assetType, filename });

    res.status(201).json({ message: "Docker asset uploaded and pending approval", asset });
  } catch (error) {
    console.error("❌ Docker Upload Error:", error.message);
    res.status(500).json({ message: "Failed to upload Docker asset" });
  }
});

/**
 * GET /docker/:projectId
 * Get approved Docker assets for a project
 */
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select('dockerAssets');
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only return approved assets for general users
    const approvedAssets = project.dockerAssets.filter(a => a.status === 'Approved');
    res.json(approvedAssets);
  } catch (error) {
    console.error("❌ Fetch Docker Assets Error:", error.message);
    res.status(500).json({ message: "Failed to fetch Docker assets" });
  }
});

export default router;
