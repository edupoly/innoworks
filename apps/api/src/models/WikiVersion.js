import mongoose from 'mongoose';

const wikiVersionSchema = new mongoose.Schema({
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'WikiPage', required: true },
  content: { type: String, required: true },
  diff: { type: mongoose.Schema.Types.Mixed },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  versionNumber: { type: Number, required: true },
  changeSummary: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

wikiVersionSchema.index({ pageId: 1, versionNumber: -1 });

export const WikiVersion = mongoose.model('WikiVersion', wikiVersionSchema);
