import request from 'supertest';
import express from 'express';
import submissionRoutes from '../routes/submissions.js';
import { authenticate } from '../middleware/auth.js';

// Mock authenticate middleware
jest.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: '507f1f77bcf86cd799439011' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/submissions', submissionRoutes);

describe('Submissions API', () => {
  it('POST /submissions should return 400 if missing fields', async () => {
    const res = await request(app)
      .post('/submissions')
      .send({ projectId: '507f1f77bcf86cd799439011' });
    expect(res.statusCode).toEqual(400);
  });
});
