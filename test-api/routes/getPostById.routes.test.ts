// Hoist all mocks before loading the router
jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/middleware/suspension.middleware');
jest.mock('../../src/features/posts/controllers/getPosts.controller');

import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { getPostByIdController } from '../../src/features/posts/controllers/getPosts.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import { ForbiddenError } from '../../src/utils/errors/api-error';

const app = express();
app.use(express.json());
app.use(postsRoutes);
// mount your global error handler
app.use(errorHandler as ErrorRequestHandler);

describe('GET /user/posts/:postId', () => {
  const mockedAuth       = jest.mocked(authenticateJWT);
  const mockedSuspend    = jest.mocked(checkUserSuspension);
  const mockedController = jest.mocked(getPostByIdController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200 → returns post details when authenticated as admin', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: { totalItems: 0, totalPages: 0, currentPage: 1 },
        },
      });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: 1, commentLimit: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Post fetched successfully',
      post: {
        id: '123',
        content: 'Test post',
        comments: [],
        comments_metadata: { totalItems: 0, totalPages: 0, currentPage: 1 },
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

    const response = await request(app)
        .get('/user/posts/123')
        .query({ commentPage: 1, commentLimit: 5 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    expect(mockedSuspend).not.toHaveBeenCalled();
    expect(mockedController).not.toHaveBeenCalled();
  });

  it('401 → when user has invalid role', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'user' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(401).json({ message: 'User not authenticated' });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: 1, commentLimit: 5 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'User not authenticated' });
    expect(mockedController).toHaveBeenCalled();
  });

  it('400 → when commentPage is less than 1', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(400).json({
        message: 'Validation error',
        errors: ['The comment page must be at least 1'],
      });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: 0, commentLimit: 5 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      errors: ['The comment page must be at least 1'],
    });
    expect(mockedController).toHaveBeenCalled();
  });

  it('400 → when commentLimit exceeds maximum', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(400).json({
        message: 'Validation error',
        errors: ['The comment limit must not exceed 20'],
      });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: 1, commentLimit: 25 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      errors: ['The comment limit must not exceed 20'],
    });
    expect(mockedController).toHaveBeenCalled();
  });

  it('200 → uses default pagination when no query params are provided', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: { totalItems: 0, totalPages: 0, currentPage: 1 },
        },
      });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.post.comments_metadata.currentPage).toBe(1);
    expect(mockedController).toHaveBeenCalled();
  });

  it('200 → handles string values for numeric params', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: { totalItems: 0, totalPages: 0, currentPage: 2 },
        },
      });
    });

    const response = await request(app)
        .get('/user/posts/123')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: '2', commentLimit: '10' });

    expect(response.status).toBe(200);
    expect(response.body.post.comments_metadata.currentPage).toBe(2);
    expect(mockedController).toHaveBeenCalled();
  });

  it('404 → when post is not found', async () => {
    mockedAuth.mockImplementation((req, _res, next) => {
      (req as any).user = { role: 'admin' };
      next();
    });
    mockedSuspend.mockImplementation((req, _res, next) => next());
    mockedController.mockImplementation((req, res) => {
      res.status(404).json({ message: 'Post not found' });
    });

    const response = await request(app)
        .get('/user/posts/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .query({ commentPage: 1, commentLimit: 5 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Post not found' });
    expect(mockedController).toHaveBeenCalled();
  });
});
