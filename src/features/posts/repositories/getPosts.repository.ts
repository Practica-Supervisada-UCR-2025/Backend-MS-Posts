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
    WHERE user_id = $1 AND status = 1 AND is_active = true
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;

  const postResult: QueryResult = await client.query(postQuery, [user_id, limit, offset]);

  return postResult.rows.length > 0 ? postResult.rows : [];
};

/**
 * Retrieves paginated visible posts for a user by their user ID, filtered by creation time.
 * Only returns posts created before the provided timestamp.
 *
 * @param user_id - The UUID of the user whose posts are being fetched.
 * @param timestamp - The ISO timestamp to filter posts (returns posts created before this time).
 * @param limit - The maximum number of rows to return (for pagination).
 * @returns An array of post objects if found, otherwise an empty array.
 * @throws Any error thrown by the database client.
 */
export const getVisiblePostsByUserIdAndTime = async (user_id: string, timestamp: string, limit: number) => {
  const postQuery = `
    SELECT id, user_id, content, file_url, media_type, created_at FROM posts 
    WHERE user_id = $1 AND status = 1 AND is_active = true AND created_at < $2
    ORDER BY created_at DESC 
    LIMIT $3
  `;

  const postResult: QueryResult = await client.query(postQuery, [user_id, timestamp, limit]);

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

/**
 * Retrieves the total number of visible posts for a user by their user ID, created before a specific time.
 *
 * @param user_id - The UUID of the user whose post count is being fetched.
 * @param timestamp - The ISO timestamp to filter posts (counts posts created before this time).
 * @returns The total count of visible posts for the user as a number.
 * @throws Any error thrown by the database client.
 */
export const getTotalVisiblePostsByUserIdAndTime = async (user_id: string, timestamp: string) => {
  const countQuery = 'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2 AND is_active = true AND created_at < $3';
  const countResult: QueryResult = await client.query(countQuery, [user_id, 1, timestamp]);

  return parseInt(countResult.rows[0].count, 10);
};
