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
 * Fetches paginated reported posts.
 *
 * @param page  - The page number to fetch (1-based).
 * @param limit - The number of posts per page (must be > 0).
 * @returns An object containing:
 *  - message: confirmation string,
 *  - posts: array of ReportedPost,
 *  - metadata: { totalPosts, totalPages, currentPage }.
 * @throws BadRequestError      If page or limit are not valid positive integers.
 * @throws InternalServerError  If an unexpected error occurs during fetching.
 */
export const getReportedPosts = async (
    page: number,
    limit: number
): Promise<ReportedPostsResponse> => {
  if (page < 1 || limit < 1) {
    throw new BadRequestError('Page and limit must be positive integers.');
  }

  try {
    const offset = (page - 1) * limit;

    const totalPosts = await getReportedPostsCount();
    const totalPages = Math.ceil(totalPosts / limit);

    const postsOrMessage = await getReportedPostsPaginated(limit, offset);

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
