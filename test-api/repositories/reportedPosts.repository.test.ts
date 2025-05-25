// Import necessary modules
import {
  getReportedPostsPaginated,
  getAllReportedPosts,
  getReportedPostsCount,
  deleteReportedPost,
  restoreReportedPost
} from '../../src/features/posts/repositories/reported.posts.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

const mockClient = client as unknown as { query: jest.Mock };

// Helper function to create a mock QueryResult
const createMockQueryResult = (): QueryResult => ({
  rows: [],
  command: '',
  rowCount: 0,
  oid: 0,
  fields: []
});

// Type for the mock query function
type MockQueryFunction = jest.Mock<Promise<QueryResult>, [string, any[]?]>;

// Cast the mock client's query function to the correct type
(mockClient.query as MockQueryFunction).mockImplementation(async () => createMockQueryResult());

describe('Reported Posts Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReportedPostsPaginated', () => {
    it('should throw an error for invalid orderBy field', async () => {
      await expect(
        getReportedPostsPaginated(10, 0, 'invalid_field' as any, 'DESC')
      ).rejects.toThrow('Invalid orderBy field. Supported fields: date, report_count');
    });

    it('should throw an error for invalid orderDirection', async () => {
      await expect(
        getReportedPostsPaginated(10, 0, 'date', 'INVALID' as any)
      ).rejects.toThrow('Invalid orderDirection. Supported directions: ASC, DESC');
    });

    it('should execute query with username filter', async () => {
      const mockQuery = jest.spyOn(client, 'query').mockResolvedValueOnce({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as unknown as QueryResult);

      await getReportedPostsPaginated(10, 0, 'date', 'DESC', 'testuser');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(u.username) = LOWER($4)'),
        expect.arrayContaining(['testuser'])
      );

      mockQuery.mockRestore();
    });

    it('should execute query without username filter', async () => {
      const mockQuery = jest.spyOn(client, 'query').mockResolvedValueOnce({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as unknown as QueryResult);

      await getReportedPostsPaginated(10, 0, 'date', 'DESC');

      expect(mockQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(u.username) = LOWER($4)')
      );

      mockQuery.mockRestore();
    });
  });

  describe('getAllReportedPosts', () => {
    it('should return all reported posts', async () => {
      const sampleRows = [
        {
          id: 'r1',
          user_id: 'u1',
          content: 'Offensive content',
          created_at: '2025-05-10T08:00:00.000Z',
          updated_at: '2025-05-10T08:00:00.000Z',
        },
      ];

      mockClient.query.mockResolvedValueOnce({ rows: sampleRows } as QueryResult);

      const result = await getAllReportedPosts();

      expect(result).toEqual(sampleRows);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return a message when no reported posts exist', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await getAllReportedPosts();

      expect(result).toEqual({ message: 'No hay publicaciones reportadas en este momento.' });
    });
  });

  describe('getReportedPostsCount', () => {
    it('should return the count of reported posts without username', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ reported_count: '5' }],
      } as QueryResult<{ reported_count: string }>);

      const result = await getReportedPostsCount();

      expect(result).toBe(5);
    });

    it('should return the count of reported posts with username', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ reported_count: '3' }],
      } as QueryResult<{ reported_count: string }>);

      const result = await getReportedPostsCount('testuser');

      expect(result).toBe(3);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(u.username) = LOWER($1)'),
        ['testuser']
      );
    });
  });

  describe('deleteReportedPost', () => {
    it('should successfully delete a post and its reports', async () => {
      mockClient.query
        .mockResolvedValueOnce(createMockQueryResult()) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE posts
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE reports
        .mockResolvedValueOnce(createMockQueryResult()); // COMMIT

      const result = await deleteReportedPost('post123');
      const calls = mockClient.query.mock.calls;
      expect(calls[0][0]).toBe('BEGIN;');
      expect(calls[1][0]).toBe('UPDATE posts SET is_active = false WHERE id = $1');
      expect(calls[1][1]).toEqual(['post123']);
      expect(calls[2][0]).toBe('UPDATE reports SET status = 0 WHERE reported_content_id = $1');
      expect(calls[2][1]).toEqual(['post123']);
      expect(calls[3][0]).toBe('COMMIT;');
      expect(result).toEqual({ message: 'Post and its reports have been successfully deactivated' });
    });

    it('should handle database errors and rollback transaction', async () => {
      const mockError = new Error('Database error');
      mockClient.query
        .mockResolvedValueOnce(createMockQueryResult()) // BEGIN
        .mockRejectedValueOnce(mockError) // First UPDATE
        .mockResolvedValueOnce(createMockQueryResult()); // ROLLBACK

      try {
        await deleteReportedPost('post123');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBe(mockError);
      }

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN;');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'UPDATE posts SET is_active = false WHERE id = $1', ['post123']);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK;');
    });

    it('should handle case where post is not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(createMockQueryResult()) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE posts
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE reports
        .mockResolvedValueOnce(createMockQueryResult()); // COMMIT

      const result = await deleteReportedPost('nonexistent');
      expect(result).toEqual({ message: 'Post and its reports have been successfully deactivated' });
    });
  });

  describe('restoreReportedPost', () => {
    it('should successfully restore a post and its reports', async () => {
      mockClient.query
        .mockResolvedValueOnce(createMockQueryResult()) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE posts
        .mockResolvedValueOnce(createMockQueryResult()) // UPDATE reports
        .mockResolvedValueOnce(createMockQueryResult()); // COMMIT

      const result = await restoreReportedPost('123');
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN;');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'UPDATE posts SET is_active = true WHERE id = $1', ['123']);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'UPDATE reports SET status = 1 WHERE reported_content_id = $1', ['123']);
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT;');
      expect(result).toEqual({ message: 'Post has been successfully restored' });
    });

    it('should rollback transaction on error', async () => {
      mockClient.query
        .mockResolvedValueOnce(createMockQueryResult()) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')) // UPDATE posts fails
        .mockResolvedValueOnce(createMockQueryResult()); // ROLLBACK

      await expect(restoreReportedPost('123')).rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN;');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, 'UPDATE posts SET is_active = true WHERE id = $1', ['123']);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK;');
    });
  });
});
