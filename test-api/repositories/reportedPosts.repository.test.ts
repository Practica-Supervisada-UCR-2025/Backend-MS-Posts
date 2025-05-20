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
    const sampleRows = [
      {
        id: 'r1',
        user_id: 'u1',
        content: 'Offensive content',
        file_url: null,
        file_size: null,
        media_type: 0,
        is_active: true,
        is_edited: false,
        status: 1,
        created_at: '2025-05-10T08:00:00.000Z',
        updated_at: '2025-05-10T08:00:00.000Z',
        username: 'alice',
        email: 'alice@example.com',
        active_reports: '2',
        total_reports: '3',
      },
    ];

    it('returns rows when there are reported posts', async () => {
      const qr = {
        rows: sampleRows,
      } as QueryResult;

      mockClient.query.mockResolvedValueOnce(qr);

      const result = await getReportedPostsPaginated(5, 10);

      expect(result).toEqual(sampleRows);
      expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [1, 5, 10],
      );
    });

    it('returns a message object when no rows', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);


      const result = await getReportedPostsPaginated(5, 10);

      expect(result).toEqual({ message: 'No reported posts in this page range.' });
      expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [1, 5, 10],
      );
    });
  });

  describe('getAllReportedPosts', () => {
    const sampleRows = [
      {
        id: 'r2',
        user_id: 'u2',
        content: 'Spam link',
        file_url: 'https://spam.example.com',
        file_size: 12345,
        media_type: 1,
        is_active: true,
        is_edited: false,
        status: 1,
        created_at: '2025-05-09T09:00:00.000Z',
        updated_at: '2025-05-09T09:00:00.000Z',
        username: 'bob',
        email: 'bob@example.com',
        active_reports: '1',
        total_reports: '1',
      },
    ];

    it('returns rows when there are reported posts', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: sampleRows } as QueryResult);

      const result = await getAllReportedPosts();

      expect(result).toEqual(sampleRows);
      expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [1],
      );
    });

    it('returns a message object when no rows', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: [],
      } as QueryResult);


      const result = await getAllReportedPosts();

      expect(result).toEqual({ message: 'No hay publicaciones reportadas en este momento.' });
      expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [1],
      );
    });
  });

  describe('getReportedPostsCount', () => {
      it('parses and returns the count from the query result without username', async () => {
          mockClient.query.mockResolvedValueOnce({
              rows: [{ reported_count: '7' }],
          } as QueryResult<{ reported_count: string }>);
  
          const count = await getReportedPostsCount();
  
          expect(count).toBe(7);
          expect(mockClient.query).toHaveBeenCalledWith(
              expect.stringContaining('SELECT'),
              [],
          );
      });
  
      it('parses and returns the count from the query result with username', async () => {
          mockClient.query.mockResolvedValueOnce({
              rows: [{ reported_count: '3' }],
          } as QueryResult<{ reported_count: string }>);
  
          const count = await getReportedPostsCount('cristopher.hernandez');
  
          expect(count).toBe(3);
          expect(mockClient.query).toHaveBeenCalledWith(
              expect.stringContaining('SELECT'),
              ['cristopher.hernandez'],
          );
      });
  });
});
