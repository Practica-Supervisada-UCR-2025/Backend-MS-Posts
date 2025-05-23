import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import { getUserPostsController } from '../../src/features/posts/controllers/getPosts.controller';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import userPostsRoutes from '../../src/features/posts/routes/post.routes';

import * as userPostsService from '../../src/features/posts/services/getPosts.service';

// Mock the service layer
jest.mock('../../src/features/posts/services/getPosts.service');

// Mock the authenticate middleware
jest.mock('../../src/features/middleware/authenticate.middleware', () => {
  const { UnauthorizedError } = require('../../src/utils/errors/api-error');
  return {
    authenticateJWT: (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer valid-token')) {
        req.user = { email: 'angel@ucr.ac.cr', uuid: 'user-uuid', role: 'user' };
        next();
      } else {
        next(new UnauthorizedError('Unauthorized'));
      }
    },
  };
});

describe('UserPosts Controller Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', userPostsRoutes);
    app.use(errorHandler as ErrorRequestHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/posts/mine', () => {
    const mockPosts = {
      data: [
        {
          id: '1',
          user_id: 'user-uuid',
          content: 'Test post',
          file_url: 'https://example.com/file.jpg',
          media_type: 1,
          created_at: '2025-05-01T12:00:00.000Z', // Updated to string format
        },
      ],
      metadata: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      },
    };

    it('should return posts for an authenticated user', async () => {
      // Mock the service
      (userPostsService.getUserPosts as jest.Mock).mockResolvedValueOnce(mockPosts);

      const response = await request(app)
        .get('/user/posts/mine')
        .set('Authorization', 'Bearer valid-token')
        .query({ page: 1, limit: 10 })
        .send()
        .expect(200);

      expect(response.body).toEqual(mockPosts);
      expect(userPostsService.getUserPosts).toHaveBeenCalledWith('user-uuid', 1, 10);
    });

    it('should return 401 when the user is not authenticated', async () => {
      const response = await request(app)
        .get('/user/posts/mine')
        .query({ page: 1, limit: 10 })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/user/posts/mine')
        .set('Authorization', 'Bearer valid-token')
        .query({ page: 'invalid', limit: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Validation error',
        details: expect.any(Array),
      });
    });
  });
});