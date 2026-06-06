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

    // Admins and Project Owners upload as 'Approved' immediately
    const isAutoApproved = req.user.role === 'Admin' || project.owner.toString() === req.user.userId;

    const asset = {
      filename,
      url,
      assetType,
      uploadedBy: req.user.userId,
      status: isAutoApproved ? 'Approved' : 'Pending'
    };

    project.dockerAssets.push(asset);
    await project.save();

    if (!isAutoApproved) {
      // Create approval request for Team members
      await ApprovalRequest.create({
        type: 'Docker',
        referenceId: project._id, 
        project: projectId,
        requestedBy: req.user.userId,
        changeSummary: `Uploaded ${assetType}: ${filename}`
      });
      await logAudit(req, 'UPLOAD_DOCKER_ASSET', 'Project', projectId, { assetType, filename, status: 'Pending' });
      return res.status(201).json({ message: "Docker asset uploaded and pending approval", asset });
    }

    await logAudit(req, 'UPLOAD_DOCKER_ASSET', 'Project', projectId, { assetType, filename, status: 'Approved' });
    res.status(201).json({ message: "Docker asset successfully registered", asset });
  } catch (error) {
    console.error("❌ Docker Upload Error:", error.message);
    res.status(500).json({ message: "Failed to upload Docker asset" });
  }
});

/**
 * PUT /docker/:projectId/assets/:assetId/approve
 * Approve a pending Docker asset
 */
router.put("/:projectId/assets/:assetId/approve", authenticate, authorize('Project Owner'), async (req, res) => {
  try {
    const { projectId, assetId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Authorization check for PO
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. Only the Project Owner can approve assets." });
    }

    const asset = project.dockerAssets.id(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    asset.status = 'Approved';
    await project.save();

    // Close the related ApprovalRequest if it exists
    await ApprovalRequest.findOneAndUpdate(
      { project: projectId, type: 'Docker', status: 'Pending' }, // Minimalistic search
      { status: 'Approved', reviewedBy: req.user.userId, reviewedAt: Date.now() }
    );

    await logAudit(req, 'APPROVE_DOCKER_ASSET', 'Project', projectId, { assetId, filename: asset.filename });

    res.json({ message: "Docker asset approved", asset });
  } catch (error) {
    console.error("❌ Docker Approve Error:", error.message);
    res.status(500).json({ message: "Failed to approve Docker asset" });
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
