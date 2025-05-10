import { getVisiblePostsByEmailPaginated, getTotalVisiblePostsByEmail } from '../repositories/user.posts.repository';
import { InternalServerError } from '../../../utils/errors/api-error';

/**
 * Fetches paginated posts for a user by their email.
 * 
 * @param email - The email of the user.
 * @param page - The page number to fetch.
 * @param limit - The number of posts per page.
 * @returns An object containing the posts and metadata (total posts, total pages, current page).
 * @throws InternalServerError if fetching posts fails.
 */
export const getUserPosts = async (email: string, page: number, limit: number) => {
  try {
    const offset = (page - 1) * limit;
    
    const totalPosts = await getTotalVisiblePostsByEmail(email);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await getVisiblePostsByEmailPaginated(email, offset, limit);

    if (!posts) {
      throw new InternalServerError('Failed to fetch posts');
    }

    console.log('Posts:', posts);

    return {
      message: 'Posts fetched successfully',
      posts,
      metadata: {
        totalPosts,
        totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    throw new InternalServerError('Failed to fetch posts');
  }
};