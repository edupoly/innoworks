import { getRedisConnection } from './redis.js';
import { User } from '../models/User.js';

const LEADERBOARD_KEY = 'leaderboard:all_time';

/**
 * Update user score in Redis leaderboard
 */
export const updateUserRank = async (userId, score) => {
  const redis = getRedisConnection();
  if (redis) {
    await redis.zadd(LEADERBOARD_KEY, score, userId.toString());
  }
};

/**
 * Get top users from Redis leaderboard
 */
export const getTopUsers = async (limit = 25) => {
  const redis = getRedisConnection();
  if (!redis) return null;

  const topUserIds = await redis.zrevrange(LEADERBOARD_KEY, 0, limit - 1);
  if (topUserIds.length === 0) return null;

  // Fetch user details from MongoDB in one go
  const users = await User.find({ _id: { $in: topUserIds } })
    .select('username avatarUrl xp level badges overallRating currentStreak verifiedContributionsCount contributionStats communicationScore adaptabilityScore');

  // Sort them back in the order of Redis rankings
  return topUserIds.map(id => users.find(u => u._id.toString() === id)).filter(Boolean);
};

/**
 * Get a specific user's rank from Redis
 */
export const getUserRank = async (userId) => {
  const redis = getRedisConnection();
  if (!redis) return null;

  const rank = await redis.zrevrank(LEADERBOARD_KEY, userId.toString());
  return rank !== null ? rank + 1 : null;
};

/**
 * Rebuild the entire leaderboard from MongoDB
 */
export const rebuildLeaderboard = async () => {
  const redis = getRedisConnection();
  if (!redis) return;

  const users = await User.find().select('_id xp');
  const pipeline = redis.pipeline();
  pipeline.del(LEADERBOARD_KEY);
  
  users.forEach(user => {
    pipeline.zadd(LEADERBOARD_KEY, user.xp || 0, user._id.toString());
  });
  
  await pipeline.exec();
  console.log('✅ Redis leaderboard rebuilt');
};
