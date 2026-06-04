import { jest } from '@jest/globals';

jest.unstable_mockModule('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: '507f1f77bcf86cd799439011' };
    next();
  },
  verifyProjectOwnership: () => (req, res, next) => next(),
  verifySubmissionReviewer: () => (req, res, next) => next()
}));

// Import after mocking
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: submissionRoutes } = await import('../routes/submissions.js');
const { testQueue } = await import('../lib/queue.js');
const { closeRedisConnection } = await import('../lib/redis.js');

const app = express();
app.use(express.json());
app.use('/submissions', submissionRoutes);

describe('Submissions API', () => {
  afterAll(async () => {
    await testQueue.close();
    await closeRedisConnection();
  });

  it('POST /submissions should return 400 if missing fields', async () => {
    const res = await request(app)
      .post('/submissions')
      .send({ projectId: '507f1f77bcf86cd799439011' });
    expect(res.statusCode).toEqual(400);
  });
});
