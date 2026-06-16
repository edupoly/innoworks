import mongoose from 'mongoose';

const dailyActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  score: { type: Number, default: 0 },
  activities: [{
    type: { type: String },
    weight: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);
