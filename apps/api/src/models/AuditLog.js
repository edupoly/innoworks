import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resource: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
