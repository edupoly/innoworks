import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  action: { 
    type: String, 
    enum: ['SUBMITTED', 'TEST_RUN', 'REVIEW_ADDED', 'CHANGES_REQUESTED', 'APPROVED', 'MERGED', 'REJECTED'],
    required: true 
  },
  description: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  forkUrl: { type: String, required: true },
  branchName: { type: String, required: true },
  prNumber: { type: Number },
  prUrl: { type: String },
  status: { 
    type: String, 
    enum: ['PENDING', 'TESTING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'MERGED', 'REJECTED'],
    default: 'PENDING' 
  },
  testOutput: { type: String },
  timeline: [timelineEventSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
submissionSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'submission'
});

submissionSchema.index({ project: 1 });
submissionSchema.index({ user: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ prNumber: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);

