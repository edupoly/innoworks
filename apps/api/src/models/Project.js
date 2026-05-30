import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  repoUrl: { type: String, required: true },
  branchName: { type: String, default: 'main' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  bounty: { type: Number, default: 100 },
  deadline: { type: Date },
  requiredSkills: [String],
  status: { type: String, enum: ['OPEN', 'ARCHIVED'], default: 'OPEN' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  techStack: [String],
  topics: [String],
  languages: [String],
  labels: [{
    name: { type: String },
    color: { type: String, default: '#6366f1' }
  }],
  contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  testers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // GitHub Repository Metadata Metrics
  stars: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  contributorsCount: { type: Number, default: 0 },
  openIssuesCount: { type: Number, default: 0 },
}, { timestamps: true });

projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);

