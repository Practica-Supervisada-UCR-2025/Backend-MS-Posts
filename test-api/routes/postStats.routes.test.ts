import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';

// Mock solo para que pase el request hasta el controller real
jest.mock('../../src/features/posts/services/postStats.service', () => ({
  getTotalPostsStatsService: jest.fn().mockResolvedValue({
    range: 'monthly',
    total: 10,
    data: [
      { label: '05-2025', count: 4 },
      { label: '06-2025', count: 6 },
    ],
  }),
}));

jest.mock('../../src/features/middleware/authenticate.middleware.ts', () => {
  return {
    authenticateJWT: (req: any, res: any, next: any) => {
      req.user = { uuid: 'user-uuid', email: 'user@test.com', role: 'user' };
      return next();
    },
  };
});

describe('Route → /posts/stats/total', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', postsRoutes);
    app.use(errorHandler as ErrorRequestHandler);
  });

  it('returns 200 with mocked service and reaches the route successfully', async () => {
    const res = await request(app)
      .get('/posts/stats/total')
      .set('Authorization', 'Bearer valid-token')
      .query({
        start_date: '01-05-2025',
        end_date: '30-06-2025',
        period: 'monthly',
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.total).toBe(10);
    expect(res.body.data.range).toBe('monthly');
  });
});
