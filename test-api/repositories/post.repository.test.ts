// Import necessary modules
import { findPostById, deleteOwnPostRepository } from '../../src/features/posts/repositories/post.repository.ts';
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
});