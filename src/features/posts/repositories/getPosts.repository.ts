import client from '../../../config/database';
import { QueryResult } from 'pg'; // Importing QueryResult for type safety

/**
 * Retrieves paginated visible posts for a user by their user ID.
 *
 * @param user_id - The UUID of the user whose posts are being fetched.
 * @param offset - The number of rows to skip before starting to return rows (for pagination).
 * @param limit - The maximum number of rows to return (for pagination).
 * @returns An array of post objects if found, otherwise an empty array.
 * @throws Any error thrown by the database client.
 */
export const getVisiblePostsByUserIdPaginated = async (user_id: string, offset: number, limit: number) => {
  // Fetching user UUID by email
  const postQuery = `
    SELECT id, content, file_url, media_type, created_at FROM posts 
    WHERE user_id = $1 AND status = 1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;

  const postResult: QueryResult = await client.query(postQuery, [user_id, limit, offset]);

  return postResult.rows.length > 0 ? postResult.rows : [];
};

/**
 * Retrieves the total number of visible posts for a user by their user ID.
 *
 * @param user_id - The UUID of the user whose post count is being fetched.
 * @returns The total count of visible posts for the user as a number.
 * @throws Any error thrown by the database client.
 */
export const getTotalVisiblePostsByUserId = async (user_id: string) => {
  const countQuery = 'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2';
  const countResult: QueryResult = await client.query(countQuery, [user_id, 1]);

  return parseInt(countResult.rows[0].count, 10);
};
