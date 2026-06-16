import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  repoUrl: { type: String, required: true },
  branchName: { type: String, default: 'main' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  bounty: { type: Number, default: 100 },
  deadline: { type: Date },
  requiredSkills: { type: [String], default: [] },
  status: { type: String, enum: ['OPEN', 'ARCHIVED'], default: 'OPEN' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  techStack: { type: [String], default: [] },
  topics: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  labels: {
    type: [{
      name: { type: String },
      color: { type: String, default: '#6366f1' }
    }],
    default: []
  },
  contributors: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  testers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  // GitHub Repository Metadata Metrics
  stars: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  contributorsCount: { type: Number, default: 0 },
  openIssuesCount: { type: Number, default: 0 },
  wikiPages: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WikiPage' }], default: [] },
  dockerAssets: {
    type: [{
      filename: String,
      url: String,
      assetType: { type: String, enum: ['Dockerfile', 'docker-compose', 'k8s', 'script'] },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
}, { timestamps: true });

projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ repoUrl: 1 });
projectSchema.index({ createdAt: -1 });

// Cascading delete middleware
projectSchema.pre(['deleteOne', 'findOneAndDelete', 'deleteMany'], async function() {
  const query = this.getQuery();
  const projects = await this.model.find(query);
  const projectIds = projects.map(p => p._id);

  if (projectIds.length > 0) {
    const mongoose = this.model.base;
    
    // Delete Submissions (this will trigger Submission's own cascading middleware)
    await mongoose.model('Submission').deleteMany({ project: { $in: projectIds } });
    
    // Delete WikiPages
    await mongoose.model('WikiPage').deleteMany({ project: { $in: projectIds } });
  }
});

export const Project = mongoose.model('Project', projectSchema);

