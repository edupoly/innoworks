import { Evaluation } from '../models/Evaluation.js';
import { User } from '../models/User.js';

/**
 * Calculate overall score based on weights:
 * 40% Code Quality, 20% Refactoring, 20% Performance, 20% Collaboration
 */
export const calculateOverallScore = (categories) => {
  const { codeQuality, refactoring, performance, collaboration } = categories;
  return (
    (codeQuality * 0.4) +
    (refactoring * 0.2) +
    (performance * 0.2) +
    (collaboration * 0.2)
  ).toFixed(1);
};

/**
 * Update user's aggregate ratings after a new evaluation is submitted.
 */
export const updateUserRatings = async (userId) => {
  try {
    const evaluations = await Evaluation.find({ contributor: userId, isPending: false });
    
    if (evaluations.length === 0) return;

    const count = evaluations.length;
    const totals = evaluations.reduce((acc, curr) => {
      acc.codeQuality += curr.categories.codeQuality;
      acc.refactoring += curr.categories.refactoring;
      acc.performance += curr.categories.performance;
      acc.collaboration += curr.categories.collaboration;
      acc.overall += curr.overallScore;
      return acc;
    }, { codeQuality: 0, refactoring: 0, performance: 0, collaboration: 0, overall: 0 });

    const averages = {
      codeQuality: Number((totals.codeQuality / count).toFixed(1)),
      refactoring: Number((totals.refactoring / count).toFixed(1)),
      performance: Number((totals.performance / count).toFixed(1)),
      collaboration: Number((totals.collaboration / count).toFixed(1))
    };

    const overallRating = Number((totals.overall / count).toFixed(1));

    await User.findByIdAndUpdate(userId, {
      overallRating,
      categoryRatings: averages
    });

  } catch (error) {
    console.error('❌ Error updating user ratings:', error.message);
  }
};
