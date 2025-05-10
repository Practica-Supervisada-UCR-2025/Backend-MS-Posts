import { getUserPostsController } from '../../src/features/posts/controllers/userPosts.controller';
import { getUserPosts } from '../../src/features/posts/services/userPosts.service';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../src/utils/errors/api-error';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';


jest.mock('../../src/features/posts/services/userPosts.service');

describe('getUserPostsController', () => {
  const mockedGetUserPosts = jest.mocked(getUserPosts);
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      user: { email: 'test@example.com' },
      query: { page: '1', limit: '10' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return posts and metadata when service succeeds', async () => {
    const mockResponse = {
      message: 'Posts fetched successfully',
      posts: [],
      metadata: {
        totalPosts: 0,
        totalPages: 0,
        currentPage: 1,
      },
    };

    mockedGetUserPosts.mockResolvedValue(mockResponse);

    await getUserPostsController(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it('should call next with BadRequestError when validation fails', async () => {
    req.query = { page: 'invalid', limit: '10' };

    await getUserPostsController(req as AuthenticatedRequest, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('Service error');
    mockedGetUserPosts.mockRejectedValue(error);

    await getUserPostsController(req as AuthenticatedRequest, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
