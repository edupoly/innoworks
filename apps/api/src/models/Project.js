import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  repoUrl: { type: String, required: true },
  branchName: { type: String, default: 'main' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  bounty: { type: Number },
  deadline: { type: Date },
  requiredSkills: [String],
  status: { type: String, default: 'OPEN' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
