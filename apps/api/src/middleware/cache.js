import { getRedisConnection } from '../lib/redis.js';

export const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedisConnection();
    if (!redis || !redis.status === 'ready') {
      return next();
    }

    // Create a unique cache key based on URL and query params
    const key = `cache:${req.originalUrl || req.url}:${req.user?.userId || 'anonymous'}`;

    try {
      const cachedResponse = await redis.get(key);
      if (cachedResponse) {
        const { data, headers } = JSON.parse(cachedResponse);
        
        // Add a custom header to indicate it was a cache hit
        res.set('X-Cache', 'HIT');
        
        // Restore headers
        Object.keys(headers).forEach(h => {
          if (h !== 'x-cache') res.set(h, headers[h]);
        });

        return res.json(data);
      }

      // If not cached, wrap res.json to store the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            data,
            headers: res.getHeaders(),
            timestamp: Date.now()
          };
          redis.set(key, JSON.stringify(cacheData), 'EX', ttlSeconds).catch(err => {
            console.error('❌ Redis Cache Set Error:', err.message);
          });
        }
        
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache Middleware Error:', error.message);
      next();
    }
  };
};

export const clearCache = async (pattern) => {
  const redis = getRedisConnection();
  if (!redis) return;

  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('❌ Clear Cache Error:', error.message);
  }
};
