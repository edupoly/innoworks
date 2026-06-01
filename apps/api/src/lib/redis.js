import "dotenv/config";
import { Redis } from 'ioredis';

// Use the production Render URL as a fallback
const DEFAULT_REDIS_URL = "redis://red-d8dv0d7avr4c7385q3fg:6379";
const REDIS_URL = process.env.REDIS_URL || DEFAULT_REDIS_URL;

const redisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    // Only retry every 10 seconds if it's failing to prevent log spam
    return Math.min(times * 2000, 10000);
  },
};

// Global shared connection
let sharedConnection = null;

export const getRedisConnection = () => {
  if (!sharedConnection) {
    try {
      // Force TCP connection by parsing the URL if it's the Render internal one
      if (REDIS_URL.includes('red-') && !REDIS_URL.startsWith('redis://')) {
        const fixedUrl = `redis://${REDIS_URL.replace(/^\/\//, '')}`;
        sharedConnection = new Redis(fixedUrl, redisOptions);
      } else {
        sharedConnection = new Redis(REDIS_URL, redisOptions);
      }
      
      sharedConnection.on('error', (err) => {
        const quietErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', 'ENOTFOUND'];
        if (!quietErrors.includes(err.code)) {
          console.error('❌ Redis Connection Error:', err.message);
        }
      });

      sharedConnection.on('connect', async () => {
        console.log('✅ Connected to Redis');
        
        // Audit: Check eviction policy
        try {
          const maxmemoryPolicy = await sharedConnection.config('GET', 'maxmemory-policy');
          if (maxmemoryPolicy && maxmemoryPolicy[1] !== 'noeviction') {
            console.warn(`⚠️ IMPORTANT: Redis eviction policy is "${maxmemoryPolicy[1]}". For BullMQ stability, it SHOULD be "noeviction".`);
            console.warn(`💡 Instruction: Set 'maxmemory-policy noeviction' in your Render Redis configuration.`);
          }
        } catch (configErr) {
          // Some managed Redis providers disable CONFIG command
          console.log('ℹ️ Redis config check skipped (CONFIG command might be disabled)');
        }
      });

      sharedConnection.on('ready', () => {
        console.log('🚀 Redis client is ready');
      });

      sharedConnection.on('reconnecting', () => {
        // Only log if not in test environment to avoid spam
        if (process.env.NODE_ENV !== 'test') {
          console.log('🔄 Redis client is reconnecting...');
        }
      });

    } catch (err) {
      console.error('❌ Failed to initialize Redis connection:', err.message);
    }
  }
  return sharedConnection;
};

export const closeRedisConnection = async () => {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = null;
    console.log('🛑 Redis connection closed');
  }
};

export default redisOptions;
