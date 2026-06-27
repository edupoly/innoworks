import { User } from '../models/User.js';
import { broadcast, emitToUser } from './socket.js';
import { updateUserRank } from './leaderboard.js';
import { recordActivity } from './consistency.js';

// Scoring config
export const METRIC_VALUES = {
  ISSUE_SOLVED: 50,
  PR_APPROVED: 100,
  PR_MERGED: 200,
  TESTING_REVIEW: 30,
  PROJECT_POSTED: 150
};

// Reputation score weights
export const REPUTATION_WEIGHTS = {
  MERGED_PR: 50,
  APPROVED_PR: 20,
  SUBMITTED_REVIEW: 10,
  POSTED_PROJECT: 30
};

/**
 * Award Contribution Score to a user.
 * Also updates engineering metrics based on the action.
 * 
 * @param {string} userId - ID of the user
 * @param {number} scoreAmount - Score to award
 * @param {string} actionReason - Reason for awarding score (e.g., 'PR_MERGED')
 * @returns {Promise<User>} Updated user document
 */
export const awardContributionScore = async (userId, scoreAmount, actionReason) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.contributionScore += scoreAmount;

    // Record activity for consistency engine
    const consistencyActionMap = {
      'PR_MERGED': 'PR_MERGED',
      'ISSUE_SOLVED': 'ISSUE_RESOLVED',
      'PR_APPROVED': 'REVIEW_ADDED',
      'TESTING_REVIEW': 'REVIEW_ADDED'
    };
    if (consistencyActionMap[actionReason]) {
      await recordActivity(userId, consistencyActionMap[actionReason]);
    }

    // Increment reputation and engineering scores based on action
    if (actionReason === 'PR_MERGED') {
      user.engineeringReputation += REPUTATION_WEIGHTS.MERGED_PR;
      user.collaborationScore += 12;
      user.perfectionScore += 18;
      user.consistencyScore += 8;
      user.innovationScore += 5;
      user.adaptabilityScore += 4;
      user.contributionStats.mergedPrsCount += 1;
      user.verifiedContributionsCount += 1;
    } else if (actionReason === 'PR_APPROVED') {
      user.engineeringReputation += REPUTATION_WEIGHTS.APPROVED_PR;
      user.collaborationScore += 8;
      user.innovationScore += 12;
      user.consistencyScore += 4;
      user.perfectionScore += 5;
    } else if (actionReason === 'TESTING_REVIEW') {
      user.engineeringReputation += REPUTATION_WEIGHTS.SUBMITTED_REVIEW;
      user.communicationScore += 15;
      user.adaptabilityScore += 10;
      user.collaborationScore += 8;
      user.consistencyScore += 5;
    } else if (actionReason === 'ISSUE_SOLVED') {
      user.engineeringReputation += 15;
      user.innovationScore += 18;
      user.adaptabilityScore += 12;
      user.consistencyScore += 6;
      user.contributionStats.issuesCount += 1;
      user.verifiedContributionsCount += 1;
    } else if (actionReason === 'PROJECT_POSTED') {
      user.engineeringReputation += REPUTATION_WEIGHTS.POSTED_PROJECT;
      user.innovationScore += 25;
      user.communicationScore += 15;
      user.collaborationScore += 5;
    }

    // Update Professional Metrics
    user.issuesResolved = user.contributionStats?.issuesCount || 0;
    
    const prsCount = user.contributionStats?.prsCount || 0;
    const mergedCount = user.contributionStats?.mergedPrsCount || 0;
    user.prSuccessRate = prsCount > 0 ? Math.round((mergedCount / prsCount) * 100) : 0;
    
    user.codeQuality = user.categoryRatings?.codeQuality ? (user.categoryRatings.codeQuality * 10) : 80;

    await user.save();
    
    // Update Redis leaderboard
    await updateUserRank(user._id, user.contributionScore);

    console.log(`🏆 Awarded ${scoreAmount} score points to @${user.username}. Total: ${user.contributionScore}`);

    // Broadcast leaderboard update to everyone
    broadcast('leaderboardUpdate', {
      userId: user._id,
      username: user.username,
      contributionScore: user.contributionScore,
      engineeringReputation: user.engineeringReputation
    });

    // Notify user specifically about their profile update
    emitToUser(user._id, 'profileUpdate', {
      contributionScore: user.contributionScore,
      engineeringReputation: user.engineeringReputation,
      stats: user.contributionStats
    });

    return user;
  } catch (error) {
    console.error('❌ Error awarding score points:', error.message);
  }
};
