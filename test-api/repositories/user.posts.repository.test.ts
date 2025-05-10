import { getVisiblePostsByEmailPaginated, getTotalVisiblePostsByEmail } from '../../src/features/posts/repositories/user.posts.repository';
import { jest } from '@jest/globals';
import client from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
}));

const mockedClient = client as jest.Mocked<typeof client>;

describe('user.posts.repository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVisiblePostsByEmailPaginated', () => {
    it('should return posts when user and posts exist', async () => {
      const mockUserResult = { rows: [{ uuid: 'user-uuid' }] };
      const mockPostResult = {
        rows: [
          {
            text: 'Test post',
            file_url: 'https://example.com/file.jpg',
            file_type: '.jpg',
            file_size: 102400,
            created_at: new Date('2025-05-01T12:00:00Z'),
          },
        ],
      };

      mockedClient.query
        .mockResolvedValueOnce(mockUserResult) // Mock user query
        .mockResolvedValueOnce(mockPostResult); // Mock post query

      const result = await getVisiblePostsByEmailPaginated('test@example.com', 0, 10);

      expect(result).toEqual(mockPostResult.rows);
      expect(mockedClient.query).toHaveBeenCalledTimes(2);
      expect(mockedClient.query).toHaveBeenCalledWith('SELECT uuid FROM users WHERE email = $1', ['test@example.com']);
      expect(mockedClient.query).toHaveBeenCalledWith(
        `
    SELECT text, file_url, file_type, file_size, created_at FROM post 
    WHERE uuid = $1 AND state = 'visible' 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `,
        ['user-uuid', 10, 0]
      );
    });

    it('should return null when user does not exist', async () => {
      mockedClient.query.mockResolvedValueOnce({ rows: [] }); // Mock user query

      const result = await getVisiblePostsByEmailPaginated('nonexistent@example.com', 0, 10);

      expect(result).toBeNull();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).toHaveBeenCalledWith('SELECT uuid FROM users WHERE email = $1', ['nonexistent@example.com']);
    });
  });

  describe('getTotalVisiblePostsByEmail', () => {
    it('should return the total count of visible posts for a user', async () => {
      const mockUserResult = { rows: [{ uuid: 'user-uuid' }] };
      const mockCountResult = { rows: [{ count: '5' }] };

      mockedClient.query
        .mockResolvedValueOnce(mockUserResult) // Mock user query
        .mockResolvedValueOnce(mockCountResult); // Mock count query

      const result = await getTotalVisiblePostsByEmail('test@example.com');

      expect(result).toBe(5);
      expect(mockedClient.query).toHaveBeenCalledTimes(2);
      expect(mockedClient.query).toHaveBeenCalledWith('SELECT uuid FROM users WHERE email = $1', ['test@example.com']);
      expect(mockedClient.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM post WHERE uuid = $1 AND state = $2', ['user-uuid', 'visible']);
    });

    it('should return 0 when user does not exist', async () => {
      mockedClient.query.mockResolvedValueOnce({ rows: [] }); // Mock user query

      const result = await getTotalVisiblePostsByEmail('nonexistent@example.com');

      expect(result).toBe(0);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).toHaveBeenCalledWith('SELECT uuid FROM users WHERE email = $1', ['nonexistent@example.com']);
    });
  });
});
