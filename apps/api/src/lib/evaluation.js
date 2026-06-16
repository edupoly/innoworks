import { Evaluation } from '../models/Evaluation.js';
import { User } from '../models/User.js';

/**
 * Calculate overall score based on weights:
 * 35% Code Quality, 17.5% Refactoring, 17.5% Performance, 25% Innovation, 5% Collaboration
 */
export const calculateOverallScore = (categories) => {
  const { 
    codeQuality = 5, 
    refactoring = 5, 
    performance = 5, 
    collaboration = 5,
    innovation = 5,
    consistency = 5,
    perfection = 5 
  } = categories;

  return (
    (codeQuality * 0.35) +
    (refactoring * 0.175) +
    (performance * 0.175) +
    (innovation * 0.25) +
    (collaboration * 0.05) +
    (consistency * 0) +
    (perfection * 0)
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
      acc.codeQuality += (curr.categories.codeQuality || 0);
      acc.refactoring += (curr.categories.refactoring || 0);
      acc.performance += (curr.categories.performance || 0);
      acc.collaboration += (curr.categories.collaboration || 0);
      acc.innovation += (curr.categories.innovation || 0);
      acc.consistency += (curr.categories.consistency || 0);
      acc.perfection += (curr.categories.perfection || 0);
      acc.overall += curr.overallScore;
      return acc;
    }, { codeQuality: 0, refactoring: 0, performance: 0, collaboration: 0, innovation: 0, consistency: 0, perfection: 0, overall: 0 });

    const averages = {
      codeQuality: Number((totals.codeQuality / count).toFixed(1)),
      refactoring: Number((totals.refactoring / count).toFixed(1)),
      performance: Number((totals.performance / count).toFixed(1)),
      collaboration: Number((totals.collaboration / count).toFixed(1)),
      innovation: Number((totals.innovation / count).toFixed(1)),
      consistency: Number((totals.consistency / count).toFixed(1)),
      perfection: Number((totals.perfection / count).toFixed(1))
    };

    const overallRating = Number((totals.overall / count).toFixed(1));

    await User.findByIdAndUpdate(userId, {
      overallRating,
      categoryRatings: averages,
      // Sync engineering scores with evaluation averages
      collaborationScore: averages.collaboration * 10,
      innovationScore: averages.innovation * 10,
      consistencyScore: averages.consistency * 10,
      perfectionScore: averages.perfection * 10
    });

  } catch (error) {
    console.error('❌ Error updating user ratings:', error.message);
  }
};
