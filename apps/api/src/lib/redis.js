import "dotenv/config";
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisConfig = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    // Only retry every 10 seconds if it's failing to prevent log spam
    return Math.min(times * 2000, 10000);
  }
};

try {
  const url = new URL(REDIS_URL);
  redisConfig = {
    ...redisConfig,
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
  };
} catch (e) {
  // Default to localhost
  redisConfig.host = '127.0.0.1';
  redisConfig.port = 6379;
}

// Global shared connection
let sharedConnection = null;

export const getRedisConnection = () => {
  if (!sharedConnection) {
    sharedConnection = new Redis(REDIS_URL, redisConfig);
    
    sharedConnection.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        // Silently handle connection refused to prevent AggregateError spam
        // We only log it once every few minutes if needed, or just let BullMQ handle its own status
      } else {
        console.error('❌ Shared Redis Connection Error:', err.message);
      }
    });

    sharedConnection.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }
  return sharedConnection;
};

export default redisConfig;
