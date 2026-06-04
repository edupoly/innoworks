import mongoose from 'mongoose';

export const validateObjectId = (req, res, next) => {
  const ids = { ...req.params, ...req.query, ...req.body };
  
  for (const key in ids) {
    if (key.toLowerCase().endsWith('id') || key === '_id') {
      if (!mongoose.Types.ObjectId.isValid(ids[key])) {
        return res.status(400).json({ message: `Invalid ID format for ${key}` });
      }
    }
  }
  next();
};

export const validateProject = (req, res, next) => {
  const { title, repoUrl, difficulty } = req.body;
  
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!title && req.method === 'POST') return res.status(400).json({ message: "Project title is required" });
    if (!repoUrl && req.method === 'POST') return res.status(400).json({ message: "Repository URL is required" });
    
    if (repoUrl && !repoUrl.startsWith('https://github.com/')) {
      return res.status(400).json({ message: "Only GitHub repositories are supported" });
    }
    
    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty level" });
    }
  }
  next();
};

export const validateSubmission = (req, res, next) => {
  const { projectId, forkUrl, branchName } = req.body;
  
  if (!projectId) return res.status(400).json({ message: "Project ID is required" });
  if (!forkUrl) return res.status(400).json({ message: "Fork Repository URL is required" });
  if (!branchName) return res.status(400).json({ message: "Branch name is required" });
  
  if (!forkUrl.startsWith('https://github.com/')) {
    return res.status(400).json({ message: "Only GitHub forks are supported" });
  }
  
  next();
};

export const validate = () => (req, res, next) => {
  // Simple validation logic or use a library like Joi/Zod
  // For now, we'll just check for required fields if needed
  next();
};
