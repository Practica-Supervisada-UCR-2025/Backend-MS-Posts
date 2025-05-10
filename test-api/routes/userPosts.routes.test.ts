import request from 'supertest';
import express from 'express';import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { getUserPostsController } from '../../src/features/posts/controllers/userPosts.controller';
import postsRoutes from '../../src/features/posts/routes/userPosts.routes';

// Creamos una app de testing
const app = express();
app.use(express.json());
app.use(postsRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/userPosts.controller');

describe('GET /api/posts/mine', () => {
  const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
  const mockedGetUserPostsController = jest.mocked(getUserPostsController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and posts when authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
    mockedGetUserPostsController.mockImplementation((req, res) => {
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts: [],
        metadata: {
          totalPosts: 0,
          totalPages: 0,
          currentPage: 1,
        },
      });
    });

    const response = await request(app)
      .get('/posts/mine')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Posts fetched successfully',
      posts: [],
      metadata: {
        totalPosts: 0,
        totalPages: 0,
        currentPage: 1,
      },
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const response = await request(app).get('/posts/mine');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });
});
