import {
  getReportedPostsPaginated,
  getReportedPostsCount,
} from '../repositories/reported.posts.repository';
import { ReportedPost } from '@/features/posts/interfaces/reportedPost.entities.interface';
import { BadRequestError, InternalServerError } from '../../../utils/errors/api-error';

/**
 * Response shape for paginated reported posts.
 */
interface ReportedPostsResponse {
  message: string;
  posts: ReportedPost[];
  metadata: {
    totalPosts: number;
    totalPages: number;
    currentPage: number;
  };
}

/**
 * Fetches paginated reported posts with optional sorting and filtering.
 *
 * @param page  - The page number to fetch (1-based).
 * @param limit - The number of posts per page (must be > 0).
 * @param orderBy - The field to sort by (date, report_count, username).
 * @param orderDirection - The direction of sorting (ASC, DESC).
 * @param username - (Optional) The username to filter reported posts.
 * @returns An object containing:
 *  - message: confirmation string,
 *  - posts: array of ReportedPost,
 *  - metadata: { totalPosts, totalPages, currentPage }.
 * @throws BadRequestError      If page or limit are not valid positive integers.
 * @throws InternalServerError  If an unexpected error occurs during fetching.
 */
export const getReportedPosts = async (
    page: number,
    limit: number,
    orderBy: 'date' | 'report_count', // Default sorting by date
    orderDirection: 'ASC' | 'DESC' = 'DESC', // Default descending order
    username?: string  // Optional username filter
): Promise<ReportedPostsResponse> => {
  if (page < 1 || limit < 1) {
    throw new BadRequestError('Page and limit must be positive integers.');
  }

  try {
    const offset = (page - 1) * limit;
    
    // Fetch the total count (with username filter if provided)
    const totalPosts = await getReportedPostsCount(username);
    const totalPages = Math.ceil(totalPosts / limit);

    // Fetching sorted and filtered posts from the repository
    const postsOrMessage = await getReportedPostsPaginated(
      limit,
      offset,
      orderBy,
      orderDirection,
      username
    );

    const posts = Array.isArray(postsOrMessage) ? postsOrMessage : [];

    return {
      message: 'Reported posts fetched successfully',
      posts,
      metadata: {
        totalPosts,
        totalPages,
        currentPage: page,
      },
    };
  } catch (err) {
    console.error('Error in getReportedPosts:', err);
    throw new InternalServerError('Failed to fetch reported posts.');
  }
};
