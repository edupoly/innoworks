import { User } from '../models/User.js';
import { DailyActivity } from '../models/DailyActivity.js';
import { sendNotification } from './notifications.js';

export const ACTIVITY_WEIGHTS = {
  PR_MERGED: 5,
  ISSUE_RESOLVED: 4,
  WIKI_UPDATE: 3,
  REVIEW_ADDED: 2,
  ISSUE_CREATED: 1,
  DISCUSSION: 1,
  TUTORIAL_ADDED: 3,
  LOGIN: 1
};

/**
 * Record a user's login and update streaks.
 */
export const recordLogin = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update/Create daily activity record for login
    const daily = await DailyActivity.findOneAndUpdate(
      { user: userId, date: today },
      { 
        $inc: { score: ACTIVITY_WEIGHTS.LOGIN },
        $push: { activities: { type: 'LOGIN', weight: ACTIVITY_WEIGHTS.LOGIN } }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update streak based on login (daily frequency)
    await updateStreak(userId, true);

    return daily;
  } catch (error) {
    console.error('❌ Error recording login:', error.message);
  }
};

/**
 * Record a user's activity and update their daily score and streaks.
 */
export const recordActivity = async (userId, activityType) => {
  try {
    const weight = ACTIVITY_WEIGHTS[activityType] || 0;
    if (weight === 0) return;

    const today = new Date().toISOString().split('T')[0];

    // 1. Update/Create daily activity record
    const daily = await DailyActivity.findOneAndUpdate(
      { user: userId, date: today },
      { 
        $inc: { score: weight },
        $push: { activities: { type: activityType, weight } }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update consistency score on every activity
    await calculateConsistencyScore(userId);

    return daily;
  } catch (error) {
    console.error('❌ Error recording activity:', error.message);
  }
};

/**
 * Update user streak logic.
 * streaks are now strictly daily login based.
 */
export const updateStreak = async (userId, isLogin = false) => {
  if (!isLogin) return; // Streaks only increment on login

  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const lastActivityStr = user.lastActivityDate ? user.lastActivityDate.toISOString().split('T')[0] : null;

  if (lastActivityStr === todayStr) {
    await calculateConsistencyScore(userId);
    return; // Already logged in today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActivityStr === yesterdayStr) {
    // Consecutive day
    user.currentStreak += 1;
  } else {
    // Check for grace day
    const daysSinceLastActivity = user.lastActivityDate 
      ? Math.floor((today - user.lastActivityDate) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysSinceLastActivity === 2 && user.graceDaysUsed < 1) {
      // Used grace day
      user.currentStreak += 1;
      user.graceDaysUsed += 1;
      
      await sendNotification(
        user._id,
        'ACHIEVEMENT_UNLOCKED',
        '🔥 Streak saved! You used a grace day to keep your consistency alive.',
        '/profile'
      );
    } else {
      // Streak reset
      user.currentStreak = 1;
      user.graceDaysUsed = 0; 
      user.streakResetDate = today;
    }
  }

  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastActivityDate = today;
  await user.save();
  
  await calculateConsistencyScore(userId);
};

/**
 * Consistency Score = (Streak weight * 0.4) + (Monthly activity weight * 0.6)
 * Normalized to 0-100
 */
export const calculateConsistencyScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyRecords = await DailyActivity.find({
    user: userId,
    date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
  });

  const activeDaysCount = dailyRecords.filter(r => r.score >= 4).length;
  const totalScoreInMonth = dailyRecords.reduce((acc, curr) => acc + curr.score, 0);

  // Normalize metrics
  const streakMetric = Math.min(user.currentStreak / 30, 1) * 100; // 30 day streak is 100%
  const monthlyMetric = Math.min(activeDaysCount / 20, 1) * 100; // 20 active days is 100%
  const intensityMetric = Math.min(totalScoreInMonth / 100, 1) * 100; // 100 score points is 100%

  user.monthlyConsistency = Math.round(
    (streakMetric * 0.4) + 
    (monthlyMetric * 0.4) + 
    (intensityMetric * 0.2)
  );

  await user.save();
};

/**
 * Weekly/Daily background task could reset streaks if no activity.
 * But for this implementation, we can check on every activity or login.
 */
