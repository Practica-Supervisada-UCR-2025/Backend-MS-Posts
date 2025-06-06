import {
  getReportedPostsPaginated,
  getReportedPostsCount,
  deleteReportedPost as deleteReportedPostFromDb,
  restoreReportedPost as restoreReportedPostFromDb,
  saveReportedPost,
} from '../repositories/reported.posts.repository';
import { ReportedPost } from '@/features/posts/interfaces/reportedPost.entities.interface';
import { ReportPostDTO } from '../dto/reportPost.dto';
import { BadRequestError, InternalServerError } from '../../../utils/errors/api-error';
import { DeleteReportedPostDto } from '../dto/deleteReportedPost.dto';
import { verify } from 'jsonwebtoken';

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
 * @interface DeleteReportedPostResponse
 * @description Response shape for delete reported post operation
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Descriptive message about the operation result
 */
interface DeleteReportedPostResponse {
  success: boolean;
  message: string;
}

/**
 * Response shape for delete reported post operation.
 * Indicates the success status and provides a descriptive message.
 */
interface DeleteReportedPostResponse {
  success: boolean;
  message: string;
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

/**
 * @function deleteReportedPost
 * @description Deletes a reported post by setting its is_active status to false
 * 
 * @param {DeleteReportedPostDto} dto - The DTO containing the post ID to delete
 * 
 * @returns {Promise<DeleteReportedPostResponse>} Object containing:
 *  - success: boolean indicating if the operation was successful
 *  - message: string describing the operation result
 * 
 * @throws {InternalServerError} If an unexpected error occurs during deletion
 */
export const deleteReportedPost = async(
  dto: DeleteReportedPostDto
): Promise<DeleteReportedPostResponse> => {
    try {
      const result = await deleteReportedPostFromDb(dto.postId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
}

/**
 * @function restoreReportedPost
 * @description Restores a reported post by setting its is_active status to true
 * 
 * @param {RestoreReportedPostDto} dto - The DTO containing the post ID to restore
 * 
 * @returns {Promise<RestoreReportedPostResponse>} Object containing:
 *  - success: boolean indicating if the operation was successful
 *  - message: string describing the operation result
 * 
 * @throws {InternalServerError} If an unexpected error occurs during restoration
 */
export const restoreReportedPost = async(
  dto: DeleteReportedPostDto
): Promise<DeleteReportedPostResponse> => {
  try {
    const result = await restoreReportedPostFromDb(dto.postId);
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

/**
 * Reports a post by saving the report details to the database.
 *
 * @param dto - The DTO containing the report details
 * @returns Object containing a message indicating the operation result
 * @throws BadRequestError If validation fails
 * @throws InternalServerError If an unexpected error occurs
 */
export const reportPost = async (dto: ReportPostDTO): Promise<{ message: string }> => {
  try {
    const { postId, reason, reportedBy } = dto;

    // const IsReported = await verifyIfPostIsReported(postId, reportedBy);
    // if (IsReported) {
    //   console.warn(`User ${reportedBy} has already reported post ${postId}`);
    //   throw new BadRequestError('This post has already been reported by you.');
    // }

    // Save the reported post to the database
    const result = await saveReportedPost(postId, reason, reportedBy);

    return { message: result.message };
  } catch (error) {
    console.error('Error in reportPost:', error);
    throw new InternalServerError('Failed to report the post.');
  }
};
