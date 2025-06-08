import { Response } from 'express';
import { getPostById } from '../../src/features/posts/services/getPosts.service';
import { getPostByIdController } from '../../src/features/posts/controllers/getPosts.controller';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../src/utils/errors/api-error';

// Mock the service
jest.mock('../../src/features/posts/services/getPosts.service');

describe('getPostByIdController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      params: { postId: '123' },
      query: { commentPage: '1', commentLimit: '5' },
      user: {
        role: 'user',
        email: 'test@example.com',
        uuid: 'test-uuid'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return post details when request is valid', async () => {
    const mockPost = {
      id: '123',
      content: 'Test post',
      comments: [],
      comments_metadata: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1
      }
    };

    (getPostById as jest.Mock).mockResolvedValue({
      message: 'Post fetched successfully',
      post: mockPost
    });

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Post fetched successfully',
      post: mockPost
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with UnauthorizedError when role is not user', async () => {
    mockRequest.user = {
      role: 'admin',
      email: 'admin@example.com',
      uuid: 'admin-uuid'
    };

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext.mock.calls[0][0].message).toBe('User not authenticated');
  });

  it('should call next with BadRequestError when validation fails', async () => {
    mockRequest.query = { commentPage: '0', commentLimit: '5' };

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockNext.mock.calls[0][0].message).toBe('Validation error');
  });

  it('should handle service errors properly', async () => {
    const error = new NotFoundError('Post not found');
    (getPostById as jest.Mock).mockRejectedValue(error);

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should validate and transform query parameters', async () => {
    mockRequest.query = { commentPage: '2', commentLimit: '10' };
    const mockPost = {
      id: '123',
      content: 'Test post',
      comments: [],
      comments_metadata: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 2
      }
    };

    (getPostById as jest.Mock).mockResolvedValue({
      message: 'Post fetched successfully',
      post: mockPost
    });

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(getPostById).toHaveBeenCalledWith('123', expect.objectContaining({
      commentPage: 2,
      commentLimit: 10
    }));
  });

  it('should use default values for missing query parameters', async () => {
    mockRequest.query = {};
    const mockPost = {
      id: '123',
      content: 'Test post',
      comments: [],
      comments_metadata: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1
      }
    };

    (getPostById as jest.Mock).mockResolvedValue({
      message: 'Post fetched successfully',
      post: mockPost
    });

    await getPostByIdController(
      mockRequest as any,
      mockResponse as Response,
      mockNext
    );

    expect(getPostById).toHaveBeenCalledWith('123', expect.objectContaining({
      commentPage: 1,
      commentLimit: 5
    }));
  });
});