import { getReportedPosts, deleteReportedPost } from '../../src/features/posts/services/reportedPosts.service';
import * as reportedRepo from '../../src/features/posts/repositories/reported.posts.repository';
import { BadRequestError, InternalServerError } from '../../src/utils/errors/api-error';
import { ReportedPost } from '../../src/features/posts/interfaces/reportedPost.entities.interface';

jest.mock('../../src/features/posts/repositories/reported.posts.repository');

const mockedCount = jest.mocked(reportedRepo.getReportedPostsCount);
const mockedPaginated = jest.mocked(reportedRepo.getReportedPostsPaginated);
const mockedDeletePost = jest.mocked(reportedRepo.deleteReportedPost);

describe('getReportedPosts service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns message, posts and metadata when posts exist', async () => {
    // Arrange
    mockedCount.mockResolvedValueOnce(5);

    const samplePosts: ReportedPost[] = [
      {
        id: 'r1',
        content: 'Offensive content',
        file_url: null,
        media_type: null,
        created_at: new Date('2025-05-10T08:00:00.000Z'),
        username: 'alice',
        email: 'alice@example.com',
        activeReports: 2,
        totalReports: 3,
        // from BasePost
        content: 'Offensive content',
        file_url: undefined,
        media_type: undefined,
        created_at: new Date('2025-05-10T08:00:00.000Z'),
        username: 'alice',
        email: 'alice@example.com',
        activeReports: 2,
        totalReports: 3,
      },
    ];
    mockedPaginated.mockResolvedValueOnce(samplePosts);

    // Arrange
    const page = 2;
    const limit = 2;
    const orderBy = 'date';          // Default or your choice ('date', 'report_count', 'username')
    const orderDirection = 'DESC';   // Default or your choice ('ASC', 'DESC')
    const user = 'cristopher.hernandez'
    // Act
    const result = await getReportedPosts(page, limit, orderBy, orderDirection,user);

    // Assert
    expect(mockedCount).toHaveBeenCalledTimes(1);
    expect(mockedPaginated).toHaveBeenCalledWith(limit, (page - 1) * limit,orderBy, orderDirection,user);
    expect(result).toEqual({
      message: 'Reported posts fetched successfully',
      posts: samplePosts,
      metadata: {
        totalPosts: 5,
        totalPages: Math.ceil(5 / limit),
        currentPage: page,
      },
    });
  });

  it('returns empty posts array when paginated returns a message object', async () => {
    // Arrange
    mockedCount.mockResolvedValueOnce(0);
    mockedPaginated.mockResolvedValueOnce({ message: 'No reported posts in this page range.' });
    const page = 2;
    const limit = 2;
    const orderBy = 'date';          // Default or your choice ('date', 'report_count', 'username')
    const orderDirection = 'DESC';   // Default or your choice ('ASC', 'DESC')
     const user = 'cristopher.hernandez'
    // Act
    const result = await getReportedPosts(page, limit,orderBy, orderDirection,user);

    // Assert
    expect(mockedCount).toHaveBeenCalledWith(user);
    expect(mockedPaginated).toHaveBeenCalledWith(page, limit,orderBy,orderDirection,user);
    expect(result).toEqual({
      message: 'Reported posts fetched successfully',
      posts: [],   // no rows → empty array
      metadata: {
        totalPosts: 0,
        totalPages: 0,
        currentPage: 2,
      },
    });
  });

  it('throws BadRequestError when page or limit is less than 1', async () => {
    await expect(getReportedPosts(0, 5, 'date', 'DESC', 'user')).rejects.toThrow(BadRequestError);
    await expect(getReportedPosts(1, 0, 'date', 'DESC', 'user')).rejects.toThrow(BadRequestError);
  });

  it('wraps repository errors in InternalServerError', async () => {
    mockedCount.mockRejectedValueOnce(new Error('DB down'));
    await expect(getReportedPosts(1, 10, 'date', 'DESC', 'user')).rejects.toThrow(InternalServerError);
  });
});

describe('deleteReportedPost service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success response when post is successfully deleted', async () => {
    // Arrange
    const mockResult = {
      message: 'Post and its reports have been successfully deactivated'
    };
    mockedDeletePost.mockResolvedValueOnce(mockResult);

    // Act
    const result = await deleteReportedPost({ postId: '123' });

    // Assert
    expect(mockedDeletePost).toHaveBeenCalledWith('123');
    expect(result).toEqual({
      success: true,
      message: mockResult.message
    });
  });

  it('returns error response when repository throws an error', async () => {
    // Arrange
    const errorMessage = 'Database connection failed';
    mockedDeletePost.mockRejectedValueOnce(new Error(errorMessage));

    // Act
    const result = await deleteReportedPost({ postId: '123' });

    // Assert
    expect(mockedDeletePost).toHaveBeenCalledWith('123');
    expect(result).toEqual({
      success: false,
      message: errorMessage
    });
  });

  it('handles non-Error objects in catch block', async () => {
    // Arrange
    mockedDeletePost.mockRejectedValueOnce('Unknown error');

    // Act
    const result = await deleteReportedPost({ postId: '123' });

    // Assert
    expect(mockedDeletePost).toHaveBeenCalledWith('123');
    expect(result).toEqual({
      success: false,
      message: 'An unexpected error occurred'
    });
  });
});
