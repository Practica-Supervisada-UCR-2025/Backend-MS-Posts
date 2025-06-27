// test-api/routes/getUserPosts.routes.test.ts

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/middleware/suspension.middleware');
jest.mock('../../src/features/posts/controllers/getPosts.controller');

import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { getUserPostsController } from '../../src/features/posts/controllers/getPosts.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import { ForbiddenError } from '../../src/utils/errors/api-error';

const app = express();
app.use(express.json());
app.use(postsRoutes);
// mount error handler to catch next(err)
app.use(errorHandler as ErrorRequestHandler);

describe('GET /api/user/posts/mine', () => {
  const mockedAuth      = jest.mocked(authenticateJWT);
  const mockedSuspend   = jest.mocked(checkUserSuspension);
  const mockedController = jest.mocked(getUserPostsController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200 → returns posts when authenticated & not suspended', async () => {
    mockedAuth.mockImplementation((req, res, next) => next());
    mockedSuspend.mockImplementation((req, res, next) => next());
    mockedController.mockImplementation((req, res) => {
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

    const res = await request(app)
        .get('/user/posts/mine')
        .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Posts fetched successfully',
      posts: [],
      metadata: {
        totalPosts: 0,
        totalPages: 0,
        currentPage: 1,
      },
    });

    expect(mockedAuth).toHaveBeenCalled();
    expect(mockedSuspend).toHaveBeenCalled();
    expect(mockedController).toHaveBeenCalled();
  });

  it('401 → when not authenticated', async () => {
    mockedAuth.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const res = await request(app).get('/user/posts/mine');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(mockedSuspend).not.toHaveBeenCalled();
    expect(mockedController).not.toHaveBeenCalled();
  });

  it('403 → when user is suspended', async () => {
    mockedAuth.mockImplementation((req, res, next) => next());
    mockedSuspend.mockImplementation((req, res, next) =>
        next(new ForbiddenError('User suspended'))
    );

    const res = await request(app)
        .get('/user/posts/mine')
        .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'User suspended' });
    expect(mockedController).not.toHaveBeenCalled();
  });
});
