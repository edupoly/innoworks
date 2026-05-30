import { User } from '../models/User.js';
import { sendNotification } from './notifications.js';

// Scoring config
export const XP_VALUES = {
  ISSUE_SOLVED: 50,
  PR_APPROVED: 100,
  PR_MERGED: 200,
  TESTING_REVIEW: 30
};

// Reputation score weights
export const REPUTATION_WEIGHTS = {
  MERGED_PR: 50,
  APPROVED_PR: 20,
  SUBMITTED_REVIEW: 10
};

/**
 * Award XP to a user and check for levels or badge unlocks.
 * 
 * @param {string} userId - ID of the user
 * @param {number} xpAmount - XP to award
 * @param {string} actionReason - Reason for awarding XP (e.g., 'PR_MERGED')
 * @returns {Promise<User>} Updated user document
 */
export const awardXP = async (userId, xpAmount, actionReason) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const previousLevel = user.level;
    user.xp += xpAmount;

    // Increment reputation score based on standard action weights
    if (actionReason === 'PR_MERGED') {
      user.reputationScore += REPUTATION_WEIGHTS.MERGED_PR;
    } else if (actionReason === 'PR_APPROVED') {
      user.reputationScore += REPUTATION_WEIGHTS.APPROVED_PR;
    } else if (actionReason === 'TESTING_REVIEW') {
      user.reputationScore += REPUTATION_WEIGHTS.SUBMITTED_REVIEW;
    }

    // Save triggers pre-save hook which caps scores and calculates levels
    await user.save();

    console.log(`🏆 Awarded ${xpAmount} XP to @${user.username}. Total: ${user.xp} XP (Level ${user.level})`);

    // Check if user leveled up
    if (user.level > previousLevel) {
      await sendNotification(
        user._id,
        'ACHIEVEMENT_UNLOCKED',
        `🎉 Level Up! You've reached Level ${user.level}!`,
        '/dashboard'
      );
    }

    // Evaluate badges
    await evaluateBadges(user);

    return user;
  } catch (error) {
    console.error('❌ Error awarding XP:', error.message);
  }
};

/**
 * Checks for badge unlocking conditions based on contribution metrics and peer reviews.
 * 
 * @param {User} user - User document
 */
export const evaluateBadges = async (user) => {
  const badgeUnlocked = [];

  // Helper to check if user already has a badge
  const hasBadge = (badgeName) => user.badges.some(b => b.name === badgeName);

  // Badge 1: First Contribution (e.g., if user has at least one accepted project or active solution)
  // Let's check user's stats dynamically
  if (!hasBadge('First Contribution') && user.xp >= XP_VALUES.ISSUE_SOLVED) {
    badgeUnlocked.push({
      name: 'First Contribution',
      description: 'Awarded for solving your very first open-source issue.'
    });
  }

  // Badge 2: 10 Merged PRs
  // We can calculate this by checking their reputation score or total PR status from submission queries.
  // For safety, let's tie it to reputation score threshold (e.g. 500+ from merged PRs)
  if (!hasBadge('10 Merged PRs') && user.reputationScore >= (REPUTATION_WEIGHTS.MERGED_PR * 10)) {
    badgeUnlocked.push({
      name: '10 Merged PRs',
      description: 'Successfully merged 10 pull requests into production repositories.'
    });
  }

  // Badge 3: Top Tester
  if (!hasBadge('Top Tester') && user.reputationScore >= 300 && user.roles.includes('TESTER')) {
    badgeUnlocked.push({
      name: 'Top Tester',
      description: 'Superb quality checking. Provided over 10 testing reports for peer pull requests.'
    });
  }

  // Badge 4: Issue Hunter
  if (!hasBadge('Issue Hunter') && user.xp >= 1000) {
    badgeUnlocked.push({
      name: 'Issue Hunter',
      description: 'Tracked down and fixed multiple complicated repository bug reports.'
    });
  }

  // Badge 5: Open Source Champion
  if (!hasBadge('Open Source Champion') && user.xp >= 5000) {
    badgeUnlocked.push({
      name: 'Open Source Champion',
      description: 'A legendary leader of the student open-source developers community.'
    });
  }

  if (badgeUnlocked.length > 0) {
    user.badges.push(...badgeUnlocked);
    await user.save();

    for (const badge of badgeUnlocked) {
      await sendNotification(
        user._id,
        'ACHIEVEMENT_UNLOCKED',
        `🥇 Achievement Unlocked: "${badge.name}"!`,
        '/dashboard'
      );
      console.log(`🥇 Badge Unlocked for @${user.username}: "${badge.name}"`);
    }
  }
};
