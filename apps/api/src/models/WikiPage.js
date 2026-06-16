import mongoose from 'mongoose';

const wikiPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  content: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending', 'Published'], 
    default: 'Draft' 
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number
  }],
  youtubeVideos: [{
    title: String,
    url: String,
    thumbnail: String
  }],
  currentVersion: { type: Number, default: 1 },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  verificationReason: { type: String },
}, { timestamps: true });

wikiPageSchema.index({ isVerified: -1 });
wikiPageSchema.index({ project: 1, slug: 1 }, { unique: true });
wikiPageSchema.index({ status: 1 });

export const WikiPage = mongoose.model('WikiPage', wikiPageSchema);
