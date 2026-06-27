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
  linkedIssue: { type: Number },
  status: { 
    type: String, 
    enum: ['PENDING', 'TESTING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'MERGED', 'REJECTED'],
    default: 'PENDING' 
  },
  testOutput: { type: String },
  rewardsAwarded: {
    type: [String], // Array of action reasons: ['PR_APPROVED', 'PR_MERGED', 'TESTING_REVIEW']
    default: []
  },
  timeline: [timelineEventSchema],
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  verificationReason: { type: String },
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

submissionSchema.index({ isVerified: -1 });
submissionSchema.index({ project: 1, user: 1 }, { unique: true });
submissionSchema.index({ status: 1 });
submissionSchema.index({ prNumber: 1 });
submissionSchema.index({ prUrl: 1 });
submissionSchema.index({ user: 1, project: 1 });

// Cascading delete middleware
submissionSchema.pre(['deleteOne', 'findOneAndDelete', 'deleteMany'], async function() {
  const query = this.getQuery();
  const submissions = await this.model.find(query);
  const submissionIds = submissions.map(s => s._id);

  if (submissionIds.length > 0) {
    const mongoose = this.model.base;
    // Delete Reviews
    await mongoose.model('Review').deleteMany({ submission: { $in: submissionIds } });
  }
});

export const Submission = mongoose.model('Submission', submissionSchema);

