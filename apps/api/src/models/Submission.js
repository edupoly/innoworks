import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  forkUrl: { type: String, required: true },
  branchName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'TESTING', 'APPROVED', 'REJECTED'],
    default: 'PENDING' 
  },
  testOutput: { type: String },
}, { timestamps: true });

submissionSchema.index({ project: 1 });
submissionSchema.index({ user: 1 });
submissionSchema.index({ status: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
