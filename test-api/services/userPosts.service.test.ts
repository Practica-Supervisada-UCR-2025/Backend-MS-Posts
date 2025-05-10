import { getUserPosts } from '../../src/features/posts/services/userPosts.service';
import { getVisiblePostsByEmailPaginated, getTotalVisiblePostsByEmail } from '../../src/features/posts/repositories/user.posts.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';

jest.mock('../../src/features/posts/repositories/user.posts.repository');

const mockedGetVisiblePostsByEmailPaginated = jest.mocked(getVisiblePostsByEmailPaginated);
const mockedGetTotalVisiblePostsByEmail = jest.mocked(getTotalVisiblePostsByEmail);

describe('getUserPosts Service', () => {
  const email = 'test@example.com';
  const page = 1;
  const limit = 10;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return posts and metadata when posts are found', async () => {
    const mockPosts = [
      {
        text: 'This is a test post',
        file_url: 'https://example.com/file.jpg',
        file_type: '.jpg',
        file_size: 102400,
        created_at: new Date('2025-05-01T12:00:00Z'),
      },
    ];

    mockedGetTotalVisiblePostsByEmail.mockResolvedValue(1);
    mockedGetVisiblePostsByEmailPaginated.mockResolvedValue(mockPosts);

    const result = await getUserPosts(email, page, limit);

    expect(result).toEqual({
      message: 'Posts fetched successfully',
      posts: mockPosts,
      metadata: {
        totalPosts: 1,
        totalPages: 1,
        currentPage: 1,
      },
    });
    expect(mockedGetTotalVisiblePostsByEmail).toHaveBeenCalledWith(email);
    expect(mockedGetVisiblePostsByEmailPaginated).toHaveBeenCalledWith(email, 0, limit);
  });

  it('should return empty posts and metadata when no posts are found', async () => {
    mockedGetTotalVisiblePostsByEmail.mockResolvedValue(0);
    mockedGetVisiblePostsByEmailPaginated.mockResolvedValue([]);

    const result = await getUserPosts(email, page, limit);

    expect(result).toEqual({
      message: 'Posts fetched successfully',
      posts: [],
      metadata: {
        totalPosts: 0,
        totalPages: 0,
        currentPage: 1,
      },
    });
    expect(mockedGetTotalVisiblePostsByEmail).toHaveBeenCalledWith(email);
    expect(mockedGetVisiblePostsByEmailPaginated).toHaveBeenCalledWith(email, 0, limit);
  });

  it('should throw InternalServerError when repository methods fail', async () => {
    mockedGetTotalVisiblePostsByEmail.mockRejectedValue(new Error('Database error'));

    await expect(getUserPosts(email, page, limit)).rejects.toThrow(InternalServerError);
    expect(mockedGetTotalVisiblePostsByEmail).toHaveBeenCalledWith(email);
    expect(mockedGetVisiblePostsByEmailPaginated).not.toHaveBeenCalled();
  });
});
