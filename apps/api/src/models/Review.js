import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  checked: { type: Boolean, default: false }
});

const reviewSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checklist: [checklistItemSchema],
  feedback: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  bugsFound: [String],
  suggestions: { type: String, default: "" },
  outcome: { 
    type: String, 
    enum: ['APPROVED', 'NEEDS_CHANGES', 'REJECTED'], 
    required: true 
  },
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);

