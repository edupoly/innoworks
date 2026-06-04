import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { sendNotification } from './notifications.js';

// Scoring config
export const XP_VALUES = {
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
 * Award XP to a user and check for levels or badge unlocks.
 * Also updates engineering metrics based on the action.
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

    // Increment reputation and engineering scores based on action
    if (actionReason === 'PR_MERGED') {
      user.reputationScore += REPUTATION_WEIGHTS.MERGED_PR;
      user.collaborationScore += 10;
      user.perfectionScore += 15;
      user.consistencyScore += 5;
      user.contributionStats.mergedPrsCount += 1;
    } else if (actionReason === 'PR_APPROVED') {
      user.reputationScore += REPUTATION_WEIGHTS.APPROVED_PR;
      user.collaborationScore += 5;
      user.innovationScore += 10;
    } else if (actionReason === 'TESTING_REVIEW') {
      user.reputationScore += REPUTATION_WEIGHTS.SUBMITTED_REVIEW;
      user.communicationScore += 10;
      user.adaptabilityScore += 5;
      user.collaborationScore += 5;
    } else if (actionReason === 'ISSUE_SOLVED') {
      user.reputationScore += 15;
      user.innovationScore += 15;
      user.adaptabilityScore += 10;
      user.contributionStats.issuesCount += 1;
    } else if (actionReason === 'PROJECT_POSTED') {
      user.reputationScore += REPUTATION_WEIGHTS.POSTED_PROJECT;
      user.innovationScore += 20;
      user.communicationScore += 10;
    }

    if (actionReason === 'PR_MERGED' || actionReason === 'PR_APPROVED' || actionReason === 'PR_CREATED') {
       // We'll increment prsCount on PR_CREATED in webhooks but just in case:
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

  // Badge 1: First Contribution
  if (!hasBadge('First Contribution') && user.xp >= XP_VALUES.ISSUE_SOLVED) {
    badgeUnlocked.push({
      name: 'First Contribution',
      description: 'Awarded for solving your very first open-source issue.',
      icon: '🚀'
    });
  }

  // Badge: Platform Pioneer (First Project Posted)
  const projectCount = await Project.countDocuments({ owner: user._id });
  if (!hasBadge('Platform Pioneer') && projectCount >= 1) {
    badgeUnlocked.push({
      name: 'Platform Pioneer',
      description: 'Awarded for posting your very first project challenge on the platform.',
      icon: '🏗️'
    });
  }

  // Badge 2: 10 Merged PRs (Engineering Veteran)
  if (!hasBadge('Engineering Veteran') && user.reputationScore >= (REPUTATION_WEIGHTS.MERGED_PR * 10)) {
    badgeUnlocked.push({
      name: 'Engineering Veteran',
      description: 'Successfully merged 10 pull requests into production repositories.',
      icon: '🎖️'
    });
  }

  // Badge 3: Master Reviewer
  if (!hasBadge('Master Reviewer') && user.communicationScore >= 80 && user.roles.includes('TESTER')) {
    badgeUnlocked.push({
      name: 'Master Reviewer',
      description: 'Superb quality checking. High communication and collaboration scores.',
      icon: '🕵️'
    });
  }

  // Badge 4: Polyglot Developer
  if (!hasBadge('Polyglot Developer') && user.adaptabilityScore >= 70) {
    badgeUnlocked.push({
      name: 'Polyglot Developer',
      description: 'Highly adaptable across multiple tech stacks and challenges.',
      icon: '🌍'
    });
  }

  // Badge 5: Open Source Champion
  if (!hasBadge('Open Source Champion') && user.xp >= 5000) {
    badgeUnlocked.push({
      name: 'Open Source Champion',
      description: 'A legendary leader of the Innoworks student community.',
      icon: '🏆'
    });
  }

  // Badge 6: Bug Hunter
  if (!hasBadge('Bug Hunter') && user.communicationScore >= 60 && user.adaptabilityScore >= 50) {
    badgeUnlocked.push({
      name: 'Bug Hunter',
      description: 'Consistently identifying issues and providing quality feedback.',
      icon: '🐛'
    });
  }

  // Badge 7: Community Pillar
  const reviewCount = await mongoose.model('Review').countDocuments({ reviewer: user._id });
  if (!hasBadge('Community Pillar') && reviewCount >= 5) {
    badgeUnlocked.push({
      name: 'Community Pillar',
      description: 'A dedicated peer reviewer helping others level up.',
      icon: '🏛️'
    });
  }

  if (badgeUnlocked.length > 0) {
    // Avoid duplicates just in case
    const newBadges = badgeUnlocked.filter(b => !hasBadge(b.name));
    if (newBadges.length > 0) {
      user.badges.push(...newBadges);
      await user.save();

      for (const badge of newBadges) {
        await sendNotification(
          user._id,
          'ACHIEVEMENT_UNLOCKED',
          `${badge.icon} Achievement Unlocked: "${badge.name}"!`,
          '/dashboard'
        );
        console.log(`🥇 Badge Unlocked for @${user.username}: "${badge.name}"`);
      }
    }
  }
};
