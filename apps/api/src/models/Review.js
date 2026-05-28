import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: { type: String, required: true },
  approved: { type: Boolean, required: true },
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);
