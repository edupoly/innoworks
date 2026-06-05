import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Wiki', 'Docker', 'Issue'], 
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  changeSummary: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

approvalRequestSchema.index({ project: 1, status: 1 });
approvalRequestSchema.index({ requestedBy: 1 });

export const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);
