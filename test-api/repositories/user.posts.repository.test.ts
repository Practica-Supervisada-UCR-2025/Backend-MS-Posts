import { getVisiblePostsByUserIdPaginated, getTotalVisiblePostsByUserId, getVisiblePostsByUserIdAndTime, getTotalVisiblePostsByUserIdAndTime } from '../../src/features/posts/repositories/getPosts.repository';
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
        expect.stringContaining(`
    SELECT 
      p.id, 
      p.content, 
      p.file_url, 
      p.media_type, 
      p.created_at,
      (
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id
      ) AS comments_count
    FROM posts p
    WHERE p.user_id = $1 AND p.status = 1 AND p.is_active = true
    ORDER BY p.created_at DESC 
    LIMIT $2 OFFSET $3
  `),
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
        expect.stringContaining(`
    SELECT 
      p.id, 
      p.content, 
      p.file_url, 
      p.media_type, 
      p.created_at,
      (
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id
      ) AS comments_count
    FROM posts p
    WHERE p.user_id = $1 AND p.status = 1 AND p.is_active = true
    ORDER BY p.created_at DESC 
    LIMIT $2 OFFSET $3
  `),
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

  describe('getVisiblePostsByUserIdAndTime', () => {
    it('should return posts for a valid user ID created before the given timestamp', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';
      const mockPosts = [
        {
          id: '1',
          user_id: 'user-uuid',
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

      const result = await getVisiblePostsByUserIdAndTime('user-uuid', timestamp, 10);

      expect(result).toEqual(mockPosts);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining( `
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.file_url, 
      p.media_type, 
      p.created_at,
      (
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id
      ) AS comments_count
    FROM posts p
    WHERE p.user_id = $1 AND p.status = 1 AND p.is_active = true AND p.created_at < $2
    ORDER BY p.created_at DESC 
    LIMIT $3
  `),
        ['user-uuid', timestamp, 10]
      );
    });

    it('should return an empty array when no posts are found before the given timestamp', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';

      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getVisiblePostsByUserIdAndTime('nonexistent-user-id', timestamp, 10);

      expect(result).toEqual([]);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining( `
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.file_url, 
      p.media_type, 
      p.created_at,
      (
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id
      ) AS comments_count
    FROM posts p
    WHERE p.user_id = $1 AND p.status = 1 AND p.is_active = true AND p.created_at < $2
    ORDER BY p.created_at DESC 
    LIMIT $3
  `),
        ['nonexistent-user-id', timestamp, 10]
      );
    });
  });

  describe('getTotalVisiblePostsByUserIdAndTime', () => {
    it('should return the total count of visible posts for a valid user ID before the given timestamp', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';

      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '3' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getTotalVisiblePostsByUserIdAndTime('user-uuid', timestamp);

      expect(result).toBe(3);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2 AND is_active = true AND created_at < $3'),
        ['user-uuid', 1, timestamp]
      );
    });

    it('should return 0 when no posts are found for the user before the given timestamp', async () => {
      const timestamp = '2025-05-05T12:00:00.000Z';

      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getTotalVisiblePostsByUserIdAndTime('nonexistent-user-id', timestamp);

      expect(result).toBe(0);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2 AND is_active = true AND created_at < $3'),
        ['nonexistent-user-id', 1, timestamp]
      );
    });
  });
});