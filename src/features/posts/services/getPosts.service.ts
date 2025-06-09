import { 
  getTotalVisiblePostsByUserId, 
  getVisiblePostsByUserIdPaginated,
  getVisiblePostsByUserIdAndTime,
  getTotalVisiblePostsByUserIdAndTime,
  getPostByIdWithDetails
} from '../repositories/getPosts.repository';
import { InternalServerError, NotFoundError } from '../../../utils/errors/api-error';
import { PaginatedResponse, BasePost, PaginatedTimeResponse } from '../interfaces/posts.entities.interface';
import { getPostComments } from './commentCrud.service';
import { GetPostByIdDTO } from '../dto/getPostById.dto';

/**
 * Fetches paginated posts for a user by their email.
 * 
 * @param user_id - The UUID of the user.
 * @param page - The page number to fetch.
 * @param limit - The number of posts per page.
 * @returns An object containing the posts and metadata (total posts, total pages, current page).
 * @throws InternalServerError if fetching posts fails.
 */
export const getUserPosts = async (user_id: string, page: number, limit: number): Promise<PaginatedResponse<BasePost>> => {
  try {
    const offset = (page - 1) * limit;

     console.log('User ID:', user_id);
    
    const totalItems = await getTotalVisiblePostsByUserId(user_id);
    if (totalItems === undefined) {
      throw new InternalServerError('Failed to fetch total posts');
    }
    const totalPages = Math.ceil(totalItems / limit);

    const data = await getVisiblePostsByUserIdPaginated(user_id, offset, limit);

    if (!data) {
      throw new InternalServerError('Failed to fetch posts');
    }

    return {
      message: 'Posts fetched successfully',
      data,
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    throw new InternalServerError('Failed to fetch posts');
  }
};

/**
 * Fetches paginated posts for any user by their UUID, filtered by time for infinite scrolling.
 * 
 * @param uuid - The UUID of the user whose posts to fetch.
 * @param page - The page number to fetch.
 * @param limit - The number of posts per page.
 * @param time - The timestamp used for filtering posts. Only posts created before this time will be returned.
 * @returns An object containing the posts and metadata (total posts, total pages, current page).
 * @throws NotFoundError if user not found, InternalServerError if fetching posts fails.
 */
export const getPostsByUserId = async (
  uuid: string, 
  limit: number,
  time: string
): Promise<PaginatedTimeResponse<BasePost>> => {
  try {
    // Check if the user exists and get filtered posts count
    var remainingItems = await getTotalVisiblePostsByUserIdAndTime(uuid, time);
    
    if (remainingItems === undefined) {
      throw new NotFoundError('Failed to fetch posts');
    }
    // Get posts that were created before the specified time
    // This ensures consistent pagination when new posts are added
    const data = await getVisiblePostsByUserIdAndTime(uuid, time, limit);

    if (!data) {
      throw new InternalServerError('Failed to fetch posts');
    }

    var remainingItems = remainingItems - data.length; // Adjust remaining items based on fetched data

    const remainingPages = Math.ceil(remainingItems / limit);


    return {
      message: 'Posts fetched successfully',
      data,
      metadata: {
        remainingItems,
        remainingPages
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError('Failed to fetch posts');
  }
};

export const getPostById = async (postId: string, params: GetPostByIdDTO) => {
  // First check if the post exists
  const post = await getPostByIdWithDetails(postId);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  // Get comments for the post with pagination
  const commentsResult = await getPostComments(postId, {
    index: params.commentPage - 1, // Convert page to index (0-based)
    startTime: new Date("2025-01-01") // started date 
  });
  
  // Return combined data
  return {
    message: 'Post fetched successfully',
    post: {
      ...post,
      comments: commentsResult.comments,
      comments_metadata: {
        totalItems: commentsResult.metadata.totalItems,
        totalPages: Math.ceil(commentsResult.metadata.totalItems / 5),
        currentPage: params.commentPage
      }
    }
  };
};