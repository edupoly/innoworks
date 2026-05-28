import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  githubAccessToken: { type: String },
  username: { type: String, required: true, unique: true },
  email: { type: String },
  avatarUrl: { type: String },
  bio: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['ADMIN', 'TESTING_TEAM', 'PROJECT_OWNER', 'CONTRIBUTOR'],
    default: 'CONTRIBUTOR' 
  },
  xp: { type: Number, default: 0 },
  collaborationScore: { type: Number, default: 0 },
  innovationScore: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  perfectionScore: { type: Number, default: 0 },
  adaptabilityScore: { type: Number, default: 0 },
  skills: [String],
  acceptedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true });

// Indices for performance
userSchema.index({ xp: -1 });

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
});

export const User = mongoose.model('User', userSchema);
