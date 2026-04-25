import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create a mock Redis client for demo purposes when Redis is not available
const createMockRedis = () => {
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    ping: async () => 'PONG',
    quit: async () => 'OK',
    on: () => {},
  } as any;
};

let redis: Redis;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('⚠️  Redis unavailable - using mock client for demo');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  // Try to connect, but use mock if it fails
  redis.connect().catch(() => {
    console.log('⚠️  Redis unavailable - using mock client for demo');
    redis = createMockRedis();
  });
} catch (error) {
  console.log('⚠️  Redis unavailable - using mock client for demo');
  redis = createMockRedis();
}

export default redis;
