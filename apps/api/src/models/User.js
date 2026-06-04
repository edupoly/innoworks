import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '🏆' },
  awardedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  githubAccessToken: { type: String },
  username: { type: String, required: true, unique: true },
  email: { type: String },
  avatarUrl: { type: String },
  bio: { type: String, default: '' },
  profileUrl: { type: String },
  repositories: [mongoose.Schema.Types.Mixed],
  contributionStats: {
    reposCount: { type: Number, default: 0 },
    prsCount: { type: Number, default: 0 },
    mergedPrsCount: { type: Number, default: 0 },
    issuesCount: { type: Number, default: 0 }
  },
  roles: { 
    type: [String], 
    enum: ['PROJECT_OWNER', 'DEVELOPER', 'TESTER'],
    default: ['DEVELOPER'] 
  },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  reputationScore: { type: Number, default: 0 },
  collaborationScore: { type: Number, default: 0 },
  innovationScore: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  perfectionScore: { type: Number, default: 0 },
  adaptabilityScore: { type: Number, default: 0 },
  skills: [String],
  acceptedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  badges: [badgeSchema],
}, { timestamps: true });

// Indices for performance
userSchema.index({ xp: -1 });
userSchema.index({ reputationScore: -1 });

// Pre-save hook to cap scores at 100
userSchema.pre('save', async function() {
  const scores = [
    'collaborationScore', 'innovationScore', 'consistencyScore', 
    'communicationScore', 'perfectionScore', 'adaptabilityScore'
  ];
  
  scores.forEach(score => {
    if (this[score] > 100) this[score] = 100;
    if (this[score] < 0) this[score] = 0;
  });

  // Dynamically calculate level based on XP (every 500 XP is a level)
  this.level = Math.floor(this.xp / 500) + 1;
});

export const User = mongoose.model('User', userSchema);

