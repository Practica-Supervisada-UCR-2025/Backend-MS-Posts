// Import necessary modules
import {
  findPostById,
  deleteOwnPostRepository,
} from '../../src/features/posts/repositories/post.repository.ts';

import { findFeedPosts, getTotalVisiblePosts } from '../../src/features/posts/repositories/post.crud.repository.ts';
import client from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockClient = (client as unknown) as { query: jest.Mock };

describe('Post Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findPostById', () => {
    it('should return the post when found', async () => {
      const samplePost = { id: '1', content: 'Sample Post' };
      mockClient.query.mockResolvedValueOnce({ rows: [samplePost] });

      const result = await findPostById('1');

      expect(result).toEqual(samplePost);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM posts WHERE id = $1',
        ['1']
      );
    });

    it('should return null when no post is found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await findPostById('1');

      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM posts WHERE id = $1',
        ['1']
      );
    });
  });

  describe('deleteOwnPostRepository', () => {
    it('should execute the query to soft delete a post', async () => {
      mockClient.query.mockResolvedValueOnce({});

      await deleteOwnPostRepository('1');

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE posts SET is_active = false WHERE id = $1',
        ['1']
      );
    });
  });

  describe('findFeedPosts', () => {
    it('should return posts feed with user info and comments_count', async () => {
      const date = new Date();
      const limit = 10;
      const sampleRows = [
        {
          id: '1',
          content: 'Post 1',
          username: 'user1',
          profile_picture: 'pic1.png',
          user_id: 'user-uuid-1',
          file_url: 'file1.png',
          created_at: date,
          media_type: 0,
          comments_count: 3,
        },
        {
          id: '2',
          content: 'Post 2',
          username: 'user2',
          profile_picture: 'pic2.png',
          user_id: 'user-uuid-2',
          file_url: 'file2.png',
          created_at: date,
          media_type: 1,
          comments_count: 0,
        },
      ];
      mockClient.query.mockResolvedValueOnce({ rows: sampleRows });

      const result = await findFeedPosts(date, limit);

      expect(result).toEqual(sampleRows);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.any(String),
        [date, limit]
      );
    });
  });

  describe('getTotalVisiblePosts', () => {
    it('should return the total number of visible posts', async () => {
      const date = new Date();
      mockClient.query.mockResolvedValueOnce({ rows: [{ total: '5' }] });

      const result = await getTotalVisiblePosts(date);

      expect(result).toBe('5');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) AS total'),
        [date]
      );
    });

    it('should return 0 if no rows are returned', async () => {
      const date = new Date();
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await getTotalVisiblePosts(date);

      expect(result).toBe(0);
    });
  });
});

