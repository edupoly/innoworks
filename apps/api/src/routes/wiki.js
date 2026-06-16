import { Router } from "express";
import { WikiPage } from '../models/WikiPage.js';
import { WikiVersion } from '../models/WikiVersion.js';
import { ApprovalRequest } from '../models/ApprovalRequest.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, logAudit } from '../middleware/rbac.js';
import { getGithubFile, createOrUpdateGithubFile, parseRepoUrl } from '../lib/github.js';
import slugify from 'slugify';

const router = Router();

// slugify helper
const getSlug = (text) => slugify(text, { lower: true, strict: true });

/**
 * GET /projects/:projectId/wiki
 * List all published wiki pages for a project (Syncs with GitHub first if possible)
 */
router.get("/:projectId", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Try to sync with GitHub
    try {
      const project = await Project.findById(projectId);
      const user = await User.findById(req.user.userId);
      
      if (project && user && user.githubAccessToken && project.repoUrl) {
        const { owner, repo } = parseRepoUrl(project.repoUrl);
        
        // Try 'wiki' folder then 'docs' folder
        let wikiFolder = await getGithubFile(user.githubAccessToken, owner, repo, 'wiki').catch(() => null);
        if (!Array.isArray(wikiFolder)) {
          wikiFolder = await getGithubFile(user.githubAccessToken, owner, repo, 'docs').catch(() => null);
        }
        
        if (Array.isArray(wikiFolder)) {
          for (const file of wikiFolder) {
            if (file.name.endsWith('.md')) {
              const slug = file.name.replace('.md', '');
              
              // Fetch file content
              const fileData = await getGithubFile(user.githubAccessToken, owner, repo, file.path);
              if (!fileData || !fileData.content) continue;
              
              const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
              const existingPage = await WikiPage.findOne({ project: projectId, slug });
              
              if (!existingPage) {
                // Create local page
                const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                await WikiPage.create({
                  title,
                  slug,
                  content: decodedContent,
                  project: projectId,
                  author: user._id,
                  status: 'Published'
                });
              } else if (existingPage.content !== decodedContent && existingPage.status === 'Published') {
                // Update local page if content changed and it's already published
                existingPage.content = decodedContent;
                existingPage.updatedAt = Date.now();
                await existingPage.save();
                
                // Also create a version for history
                await WikiVersion.create({
                  pageId: existingPage._id,
                  content: decodedContent,
                  updatedBy: user._id,
                  versionNumber: existingPage.currentVersion + 1,
                  changeSummary: 'Synced from GitHub'
                });
                
                existingPage.currentVersion += 1;
                await existingPage.save();
              }
            }
          }
        }
      }
    } catch (syncError) {
      console.error("⚠️ Failed to sync wiki from GitHub:", syncError.message);
    }

    const pages = await WikiPage.find({ project: projectId, status: 'Published' })
      .select('title slug status author updatedAt')
      .populate('author', 'username avatarUrl');
    res.json(pages);
  } catch (error) {
    console.error("❌ Wiki Fetch Error:", error.message);
    res.status(500).json({ message: "Failed to fetch wiki pages" });
  }
});

/**
 * GET /projects/:projectId/wiki/:slug
 * Get a specific wiki page (published)
 */
router.get("/:projectId/:slug", async (req, res) => {
  try {
    const { projectId, slug } = req.params;
    const page = await WikiPage.findOne({ project: projectId, slug, status: 'Published' })
      .populate('author', 'username avatarUrl');
    
    if (!page) return res.status(404).json({ message: "Wiki page not found" });
    
    res.json(page);
  } catch (error) {
    console.error("❌ Wiki Page Fetch Error:", error.message);
    res.status(500).json({ message: "Failed to fetch wiki page" });
  }
});

/**
 * POST /projects/:projectId/wiki
 * Create a new wiki page (Draft) - Team or higher
 */
router.post("/:projectId", authenticate, authorize('Team'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const slug = getSlug(title);
    
    // Check if slug exists
    const existing = await WikiPage.findOne({ project: projectId, slug });
    if (existing) return res.status(400).json({ message: "A page with this title already exists in this project." });

    const page = await WikiPage.create({
      title,
      slug,
      content,
      project: projectId,
      author: req.user.userId,
      status: 'Draft'
    });

    // Create initial version
    await WikiVersion.create({
      pageId: page._id,
      content,
      updatedBy: req.user.userId,
      versionNumber: 1,
      changeSummary: 'Initial creation'
    });

    await logAudit(req, 'CREATE_WIKI_PAGE', 'WikiPage', page._id, { title, slug });

    res.status(201).json(page);
  } catch (error) {
    console.error("❌ Wiki Create Error:", error.message);
    res.status(500).json({ message: "Failed to create wiki page" });
  }
});

/**
 * PUT /projects/:projectId/wiki/:pageId
 * Update a wiki page and create a new version - Team or higher
 */
router.put("/:projectId/:pageId", authenticate, authorize('Team'), async (req, res) => {
  try {
    const { pageId } = req.params;
    const { content, changeSummary } = req.body;

    const page = await WikiPage.findById(pageId);
    if (!page) return res.status(404).json({ message: "Wiki page not found" });

    // In a real app, we'd calculate a diff here
    
    const newVersionNumber = page.currentVersion + 1;

    // If it's already Published, updating it might set it back to Draft or Pending depending on workflow
    // For now, let's keep status as is if it's already Published, otherwise it's a Draft update
    
    await WikiVersion.create({
      pageId: page._id,
      content,
      updatedBy: req.user.userId,
      versionNumber: newVersionNumber,
      changeSummary
    });

    page.content = content;
    page.currentVersion = newVersionNumber;
    await page.save();

    await logAudit(req, 'UPDATE_WIKI_PAGE', 'WikiPage', page._id, { version: newVersionNumber });

    res.json(page);
  } catch (error) {
    console.error("❌ Wiki Update Error:", error.message);
    res.status(500).json({ message: "Failed to update wiki page" });
  }
});

/**
 * POST /projects/:projectId/wiki/:pageId/request-approval
 * Submit a wiki page for approval - Team or higher
 */
router.post("/:projectId/:pageId/request-approval", authenticate, authorize('Team'), async (req, res) => {
  try {
    const { pageId, projectId } = req.params;
    const { changeSummary } = req.body;

    const page = await WikiPage.findById(pageId);
    if (!page) return res.status(404).json({ message: "Wiki page not found" });

    page.status = 'Pending';
    await page.save();

    const request = await ApprovalRequest.create({
      type: 'Wiki',
      referenceId: pageId,
      project: projectId,
      requestedBy: req.user.userId,
      changeSummary
    });

    await logAudit(req, 'SUBMIT_WIKI_FOR_APPROVAL', 'WikiPage', pageId, { requestId: request._id });

    res.json({ message: "Approval request submitted", request });
  } catch (error) {
    console.error("❌ Wiki Approval Request Error:", error.message);
    res.status(500).json({ message: "Failed to submit approval request" });
  }
});

/**
 * PUT /projects/:projectId/wiki/:pageId/approve
 * Approve a wiki page - Project Owner or Admin
 */
router.put("/:projectId/:pageId/approve", authenticate, authorize('Project Owner'), async (req, res) => {
  try {
    const { pageId } = req.params;
    const { requestId, comment } = req.body;

    const page = await WikiPage.findById(pageId);
    if (!page) return res.status(404).json({ message: "Wiki page not found" });

    const request = await ApprovalRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Approval request not found" });

    const project = await Project.findById(page.project);
    
    // If not Admin, check if user is the Project Owner of THIS project
    if (req.user.role !== 'Admin') {
      if (project.owner.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Only the Project Owner can approve this request." });
      }
    }

    page.status = 'Published';
    await page.save();

    request.status = 'Approved';
    request.reviewedBy = req.user.userId;
    request.reviewedAt = Date.now();
    if (comment) {
      request.comments.push({ user: req.user.userId, text: comment });
    }
    await request.save();

    // Replicate to GitHub
    try {
      const user = await User.findById(req.user.userId);
      if (user && user.githubAccessToken && project.repoUrl) {
        const { owner, repo } = parseRepoUrl(project.repoUrl);
        const path = `wiki/${page.slug}.md`;
        let sha = null;
        
        // Try to get existing file to get its SHA
        try {
          const existingFile = await getGithubFile(user.githubAccessToken, owner, repo, path);
          if (existingFile && existingFile.sha) {
            sha = existingFile.sha;
          }
        } catch (e) {
          // File might not exist yet, ignore
        }

        await createOrUpdateGithubFile(
          user.githubAccessToken,
          owner,
          repo,
          path,
          `docs: Update wiki page ${page.title}`,
          page.content,
          sha
        );
      }
    } catch (ghError) {
      console.error("⚠️ Failed to replicate wiki to GitHub:", ghError.message);
      // We don't fail the approval if GitHub sync fails, just log it
    }

    await logAudit(req, 'APPROVE_WIKI_PAGE', 'WikiPage', pageId, { requestId: request._id });

    res.json({ message: "Wiki page approved and published", page });
  } catch (error) {
    console.error("❌ Wiki Approve Error:", error.message);
    res.status(500).json({ message: "Failed to approve wiki page" });
  }
});

export default router;
