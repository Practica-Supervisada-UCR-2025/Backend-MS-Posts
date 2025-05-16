import { getVisiblePostsByUserIdPaginated, getTotalVisiblePostsByUserId } from '../../src/features/posts/repositories/getPosts.repository';
import { QueryResult } from 'pg';

const mockClient = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('User Posts Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVisiblePostsByUserIdPaginated', () => {
    it('should return posts for a valid user ID', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test post',
          file_url: 'https://example.com/file.jpg',
          media_type: 1,
          created_at: '2025-05-01T12:00:00.000Z',
        },
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockPosts,
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getVisiblePostsByUserIdPaginated('user-uuid', 0, 10);

      expect(result).toEqual(mockPosts);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, content, file_url, media_type, created_at FROM posts'),
        ['user-uuid', 10, 0]
      );
    });

    it('should return an empty array when no posts are found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getVisiblePostsByUserIdPaginated('nonexistent-user-id', 0, 10);

      expect(result).toEqual([]);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, content, file_url, media_type, created_at FROM posts'),
        ['nonexistent-user-id', 10, 0]
      );
    });
  });

  describe('getTotalVisiblePostsByUserId', () => {
    it('should return the total count of visible posts for a valid user ID', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '5' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getTotalVisiblePostsByUserId('user-uuid');

      expect(result).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2'),
        ['user-uuid', 1]
      );
    });

    it('should return 0 when no posts are found for the user', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getTotalVisiblePostsByUserId('nonexistent-user-id');

      expect(result).toBe(0);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2'),
        ['nonexistent-user-id', 1]
      );
    });
  });
});