import { getTotalVisiblePostsByUserId, getVisiblePostsByUserIdPaginated } from '../repositories/getPosts.repository';
import { InternalServerError } from '../../../utils/errors/api-error';
import { PaginatedResponse, BasePost } from '../interfaces/posts.entities.interface';


/**
 * Fetches paginated posts for a user by their email.
 * 
 * @param user_id - The UUID of the user.
 * @param page - The page number to fetch.
 * @param limit - The number of posts per page.
 * @returns An object containing the posts and metadata (total posts, total pages, current page).
 * @throws InternalServerError if fetching posts fails.
 */
export const getUserPosts = async (user_id: string, page: number, limit: number): Promise<PaginatedResponse<BasePost>>=> {
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