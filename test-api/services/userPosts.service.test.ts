import { getUserPosts } from '../../src/features/posts/services/getPosts.service';
import * as userPostsRepository from '../../src/features/posts/repositories/getPosts.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';

jest.mock('../../src/features/posts/repositories/getPosts.repository');

describe('UserPosts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPosts', () => {
    it('should return posts and metadata when posts are found', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test post',
          file_url: 'https://example.com/file.jpg',
          media_type: 1,
          created_at: new Date('2025-05-01T12:00:00Z'),
        },
      ];

      (userPostsRepository.getTotalVisiblePostsByUserId as jest.Mock).mockResolvedValueOnce(1);
      (userPostsRepository.getVisiblePostsByUserIdPaginated as jest.Mock).mockResolvedValueOnce(mockPosts);

      const result = await getUserPosts('user-uuid', 1, 10);

      expect(userPostsRepository.getTotalVisiblePostsByUserId).toHaveBeenCalledWith('user-uuid');
      expect(userPostsRepository.getVisiblePostsByUserIdPaginated).toHaveBeenCalledWith('user-uuid', 0, 10);
      expect(result).toEqual({
        message: 'Posts fetched successfully',
        data: mockPosts,
        metadata: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
        },
      });
    });

    it('should return empty posts and metadata when no posts are found', async () => {
      (userPostsRepository.getTotalVisiblePostsByUserId as jest.Mock).mockResolvedValueOnce(0);
      (userPostsRepository.getVisiblePostsByUserIdPaginated as jest.Mock).mockResolvedValueOnce([]);

      const result = await getUserPosts('user-uuid', 1, 10);

      expect(userPostsRepository.getTotalVisiblePostsByUserId).toHaveBeenCalledWith('user-uuid');
      expect(userPostsRepository.getVisiblePostsByUserIdPaginated).toHaveBeenCalledWith('user-uuid', 0, 10);
      expect(result).toEqual({
        message: 'Posts fetched successfully',
        data: [],
        metadata: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
        },
      });
    });

    it('should throw InternalServerError when repository methods fail', async () => {
      (userPostsRepository.getTotalVisiblePostsByUserId as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(getUserPosts('user-uuid', 1, 10)).rejects.toThrow(InternalServerError);
    });
  });
});