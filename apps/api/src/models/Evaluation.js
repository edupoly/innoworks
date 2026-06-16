import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  type: { 
    type: String, 
    enum: ['PLATFORM', 'GITHUB_MERGE'], 
    default: 'PLATFORM' 
  },
  categories: {
    codeQuality: { type: Number, min: 1, max: 10, required: true },
    refactoring: { type: Number, min: 1, max: 10, required: true },
    performance: { type: Number, min: 1, max: 10, required: true },
    collaboration: { type: Number, min: 1, max: 10, required: true }
  },
  overallScore: { type: Number, required: true },
  feedback: { type: String },
  isPending: { type: Boolean, default: false }
}, { timestamps: true });

// Indices for performance
evaluationSchema.index({ contributor: 1, project: 1 });
evaluationSchema.index({ isPending: 1 });

export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
