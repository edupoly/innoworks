import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
    default: 'Open' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  severity: { 
    type: String, 
    enum: ['Trivial', 'Minor', 'Major', 'Blocker'], 
    default: 'Minor' 
  },
  labels: [{
    name: String,
    color: String
  }],
  milestone: { type: String },
  template: { 
    type: String, 
    enum: ['Bug', 'Feature', 'Docs', 'Security', 'General'],
    default: 'General'
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String
  }],
  timeline: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }]
}, { timestamps: true });

issueSchema.index({ project: 1, status: 1 });
issueSchema.index({ author: 1 });

export const Issue = mongoose.model('Issue', issueSchema);
