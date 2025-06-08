import { getPostByIdWithDetails } from '../../src/features/posts/repositories/getPosts.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

// Define the type for our post with user details
interface PostWithUserDetails {
  id: string;
  user_id: string;
  content: string;
  file_url: string | null;
  file_size: number | null;
  media_type: string | null;
  created_at: Date;
  updated_at: Date;
  username: string;
  email: string;
  total_comments: string;
  active_reports: string;
  total_reports: string;
}

// Mock the database client
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [], rowCount: 0 }))
  }
}));

type QueryFn = jest.Mock<Promise<QueryResult<PostWithUserDetails>>>;

describe('getPostByIdWithDetails repository', () => {
  const mockClient = {
    ...client,
    query: client.query as QueryFn
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return post details when post exists', async () => {
    const mockPost: PostWithUserDetails = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      file_url: null,
      file_size: null,
      media_type: null,
      username: 'testuser',
      email: 'test@example.com',
      total_comments: '0',
      active_reports: '0',
      total_reports: '0'
    };

    const mockQueryResult: QueryResult<PostWithUserDetails> = {
      rows: [mockPost],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await getPostByIdWithDetails('123');

    expect(result).toEqual(mockPost);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.any(String),
      ['123']
    );
    
    // Verify the query includes joins with user table and is selecting visible posts only
    const queryCall = mockClient.query.mock.calls[0][0];
    expect(queryCall.toLowerCase()).toContain('join users');
    expect(queryCall.toLowerCase()).toContain('is_active = true');
    expect(queryCall.toLowerCase()).toContain('total_comments');
    expect(queryCall.toLowerCase()).toContain('active_reports');
    expect(queryCall.toLowerCase()).toContain('total_reports');
  });

  it('should return null when post does not exist', async () => {
    const mockQueryResult: QueryResult<PostWithUserDetails> = {
      rows: [],
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: []
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await getPostByIdWithDetails('nonexistent');

    expect(result).toBeNull();
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.any(String),
      ['nonexistent']
    );
  });

  it('should return null when post exists but is not visible', async () => {
    const mockPost: PostWithUserDetails = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      file_url: null,
      file_size: null,
      media_type: null,
      username: 'testuser',
      email: 'test@example.com',
      total_comments: '0',
      active_reports: '0',
      total_reports: '0'
    };

    const mockQueryResult: QueryResult<PostWithUserDetails> = {
      rows: [],
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: []
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await getPostByIdWithDetails('123');

    expect(result).toBeNull();
  });

  it('should include user details in the result', async () => {
    const mockPost: PostWithUserDetails = {
      id: '123',
      content: 'Test post content',
      user_id: 'user123',
      created_at: new Date(),
      updated_at: new Date(),
      file_url: null,
      file_size: null,
      media_type: null,
      username: 'testuser',
      email: 'test@example.com',
      total_comments: '0',
      active_reports: '0',
      total_reports: '0'
    };

    const mockQueryResult: QueryResult<PostWithUserDetails> = {
      rows: [mockPost],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    };

    mockClient.query.mockResolvedValue(mockQueryResult);

    const result = await getPostByIdWithDetails('123');

    expect(result).toEqual(mockPost);
    expect(result?.username).toBe('testuser');
    expect(result?.email).toBe('test@example.com');
    expect(result?.total_comments).toBe('0');
    expect(result?.active_reports).toBe('0');
    expect(result?.total_reports).toBe('0');
  });
});