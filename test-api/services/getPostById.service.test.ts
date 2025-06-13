import { getPostById } from '../../src/features/posts/services/getPosts.service';
import { getPostByIdWithDetails } from '../../src/features/posts/repositories/getPosts.repository';
import { getPostComments } from '../../src/features/posts/services/commentCrud.service';
import { NotFoundError } from '../../src/utils/errors/api-error';

// Mock the repository and comment service
jest.mock('../../src/features/posts/repositories/getPosts.repository');
jest.mock('../../src/features/posts/services/commentCrud.service');

describe('getPostById service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return post with comments when post exists', async () => {
    const mockPostData = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      likes: 0,
      is_visible: true
    };

    const mockComments = {
      comments: [
        {
          id: 'comment1',
          content: 'Test comment'
        }
      ],
      metadata: {
        totalItems: 1,
        currentPage: 1
      }
    };

    (getPostByIdWithDetails as jest.Mock).mockResolvedValue(mockPostData);
    (getPostComments as jest.Mock).mockResolvedValue(mockComments);

    const result = await getPostById('123', { commentPage: 1, commentLimit: 5 });

    expect(result).toEqual({
      message: 'Post fetched successfully',
      post: {
        ...mockPostData,
        comments: mockComments.comments,
        comments_metadata: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1
        }
      }
    });

    expect(getPostByIdWithDetails).toHaveBeenCalledWith('123');
    expect(getPostComments).toHaveBeenCalledWith('123', {
      index: 0,
      startTime: expect.any(Date)
    });
  });

  it('should throw NotFoundError when post does not exist', async () => {
    (getPostByIdWithDetails as jest.Mock).mockResolvedValue(null);

    await expect(getPostById('nonexistent', { commentPage: 1, commentLimit: 5 }))
      .rejects.toThrow(NotFoundError);

    expect(getPostComments).not.toHaveBeenCalled();
  });

  it('should convert comment page to zero-based index', async () => {
    const mockPostData = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      likes: 0,
      is_visible: true
    };

    const mockComments = {
      comments: [],
      metadata: {
        totalItems: 0,
        currentPage: 2
      }
    };

    (getPostByIdWithDetails as jest.Mock).mockResolvedValue(mockPostData);
    (getPostComments as jest.Mock).mockResolvedValue(mockComments);

    await getPostById('123', { commentPage: 2, commentLimit: 5 });

    expect(getPostComments).toHaveBeenCalledWith('123', {
      index: 1, // page 2 becomes index 1
      startTime: expect.any(Date)
    });
  });

  it('should calculate total pages correctly based on comment count', async () => {
    const mockPostData = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      likes: 0,
      is_visible: true
    };

    const mockComments = {
      comments: [],
      metadata: {
        totalItems: 11, // This should result in 3 pages with limit of 5
        currentPage: 1
      }
    };

    (getPostByIdWithDetails as jest.Mock).mockResolvedValue(mockPostData);
    (getPostComments as jest.Mock).mockResolvedValue(mockComments);

    const result = await getPostById('123', { commentPage: 1, commentLimit: 5 });

    expect(result.post.comments_metadata.totalPages).toBe(3);
  });
});