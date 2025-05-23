// Import necessary modules
import {
  getReportedPostsPaginated,
  getAllReportedPosts,
  getReportedPostsCount,
} from '../../src/features/posts/repositories/reported.posts.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockClient = (client as unknown) as { query: jest.Mock };

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
});
