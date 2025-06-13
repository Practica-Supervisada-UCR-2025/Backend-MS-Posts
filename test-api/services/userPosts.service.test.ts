import { getUserPosts, getPostsByUserId } from '../../src/features/posts/services/getPosts.service';
import * as userPostsRepository from '../../src/features/posts/repositories/getPosts.repository';
import { InternalServerError, NotFoundError } from '../../src/utils/errors/api-error';

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

  describe('getPostsByUserId', () => {
    it('should return posts and metadata when posts are found before the given timestamp', async () => {
      const mockPosts = [
        {
          id: '1',
          user_id: 'user-uuid',
          content: 'Test post',
          file_url: 'https://example.com/file.jpg',
          media_type: 1,
          created_at: new Date('2025-05-01T12:00:00Z'),
        },
      ];
      
      const timestamp = '2025-05-05T12:00:00.000Z';
      const limit = 10;

      (userPostsRepository.getTotalVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(3);
      (userPostsRepository.getVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(mockPosts);

      const result = await getPostsByUserId('user-uuid', limit, timestamp);

      expect(userPostsRepository.getTotalVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp);
      expect(userPostsRepository.getVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp, limit);
      expect(result).toEqual({
        message: 'Posts fetched successfully',
        data: mockPosts,
        metadata: {
          remainingItems: 2,  // 3 total - 1 returned = 2 remaining
          remainingPages: 1,  // Math.ceil(2/10) = 1
        },
      });
    });

    it('should return empty posts and metadata when no posts are found before the given timestamp', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';
      const limit = 10;

      (userPostsRepository.getTotalVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(0);
      (userPostsRepository.getVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce([]);

      const result = await getPostsByUserId('user-uuid', limit, timestamp);

      expect(userPostsRepository.getTotalVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp);
      expect(userPostsRepository.getVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp, limit);
      expect(result).toEqual({
        message: 'Posts fetched successfully',
        data: [],
        metadata: {
          remainingItems: 0,
          remainingPages: 0,
        },
      });
    });

    it('should throw NotFoundError when getTotalVisiblePostsByUserIdAndTime fails', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';
      const limit = 10;

      (userPostsRepository.getTotalVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(getPostsByUserId('user-uuid', limit, timestamp)).rejects.toThrow(NotFoundError);
      expect(userPostsRepository.getTotalVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp);
    });

    it('should throw InternalServerError when getVisiblePostsByUserIdAndTime fails', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';
      const limit = 10;

      (userPostsRepository.getTotalVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(5);
      (userPostsRepository.getVisiblePostsByUserIdAndTime as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(getPostsByUserId('user-uuid', limit, timestamp)).rejects.toThrow(InternalServerError);
      expect(userPostsRepository.getTotalVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp);
      expect(userPostsRepository.getVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp, limit);
    });

    it('should throw InternalServerError when any other error occurs', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';
      const limit = 10;

      (userPostsRepository.getTotalVisiblePostsByUserIdAndTime as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(getPostsByUserId('user-uuid', limit, timestamp)).rejects.toThrow(InternalServerError);
      expect(userPostsRepository.getTotalVisiblePostsByUserIdAndTime).toHaveBeenCalledWith('user-uuid', timestamp);
    });
  });
});