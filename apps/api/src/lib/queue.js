import { Queue } from "bullmq";
import { getRedisConnection } from "./redis.js";

const connection = getRedisConnection();

export const testQueue = new Queue("test-execution", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  }
});

testQueue.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.error('❌ Redis Queue Error:', err.message);
  }
});
