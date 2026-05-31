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
      // to avoid 'ENOENT' which happens when ioredis misinterprets the host as a socket path
      if (REDIS_URL.includes('red-') && !REDIS_URL.startsWith('redis://')) {
        // Fix potential missing protocol
        const fixedUrl = `redis://${REDIS_URL.replace(/^\/\//, '')}`;
        sharedConnection = new Redis(fixedUrl, redisOptions);
      } else {
        sharedConnection = new Redis(REDIS_URL, redisOptions);
      }
      
      sharedConnection.on('error', (err) => {
        // Silently handle common connection issues to prevent process-crashing AggregateErrors
        const quietErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', 'ENOTFOUND'];
        if (!quietErrors.includes(err.code)) {
          console.error('❌ Redis Connection Error:', err.message);
        }
      });

      sharedConnection.on('connect', () => {
        console.log('✅ Connected to Redis');
      });
    } catch (err) {
      console.error('❌ Failed to initialize Redis connection:', err.message);
    }
  }
  return sharedConnection;
};

export default redisOptions;
