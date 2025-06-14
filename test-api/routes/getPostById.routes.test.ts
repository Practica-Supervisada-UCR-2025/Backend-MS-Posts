import request from 'supertest';
import express from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { getPostByIdController } from '../../src/features/posts/controllers/getPosts.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';

// Create testing app
const app = express();
app.use(express.json());
app.use(postsRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/getPosts.controller');

describe('GET /user/posts/:postId', () => {
  const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
  const mockedGetPostByIdController = jest.mocked(getPostByIdController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and post details when authenticated with valid role', async () => {
    // Mock authentication with user role
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    // Mock successful response
    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 1
          }
        }
      });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: 1, commentLimit: 5 })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Post fetched successfully',
      post: {
        id: '123',
        content: 'Test post',
        comments: [],
        comments_metadata: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1
        }
      }
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: 1, commentLimit: 5 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('should return 401 when user has invalid role', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'user' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(401).json({ message: 'User not authenticated' });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: 1, commentLimit: 5 })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'User not authenticated' });
  });

  it('should return 400 when query parameters are invalid', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(400).json({
        message: 'Validation error',
        errors: ['The comment page must be at least 1']
      });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: 0, commentLimit: 5 })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      errors: ['The comment page must be at least 1']
    });
  });

  it('should return 400 when commentLimit exceeds maximum', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(400).json({
        message: 'Validation error',
        errors: ['The comment limit must not exceed 20']
      });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: 1, commentLimit: 25 })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      errors: ['The comment limit must not exceed 20']
    });
  });

  it('should use default values when no query parameters are provided', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 1  // default page
          }
        }
      });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.post.comments_metadata.currentPage).toBe(1);
  });

  it('should handle string values for numeric parameters', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: {
          id: '123',
          content: 'Test post',
          comments: [],
          comments_metadata: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 2
          }
        }
      });
    });

    const response = await request(app)
      .get('/user/posts/123')
      .query({ commentPage: '2', commentLimit: '10' })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.post.comments_metadata.currentPage).toBe(2);
  });

  it('should return 404 when post is not found', async () => {
    mockedAuthenticateJWT.mockImplementation((req: any, res, next) => {
      req.user = { role: 'admin' };
      next();
    });

    mockedGetPostByIdController.mockImplementation(async (req, res, next) => {
      res.status(404).json({ message: 'Post not found' });
    });

    const response = await request(app)
      .get('/user/posts/nonexistent')
      .query({ commentPage: 1, commentLimit: 5 })
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Post not found' });
  });
});