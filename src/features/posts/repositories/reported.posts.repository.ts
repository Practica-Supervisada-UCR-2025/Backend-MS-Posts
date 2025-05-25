import client from '../../../config/database';
import { ReportedPost } from '../interfaces/reportedPost.entities.interface';
import { QueryResult } from 'pg';


// { NO_ACTIVE = 0, ACTIVE = 1 }
const ACTIVE_REPORT_STATUS = 1;

/**
 * Retrieves paginated reported posts.
 */
const validFields = {
    date: 'p.created_at',
    report_count: 'total_reports',
} as const;

type OrderByField = keyof typeof validFields;

export const getReportedPostsPaginated = async (
    limit: number,
    offset: number,
    orderBy: OrderByField = 'date',
    orderDirection: 'ASC' | 'DESC' = 'DESC',
    username?: string  // Optional username filter
): Promise<ReportedPost[] | { message: string }> => {
    // Validate the orderBy and orderDirection parameters
    if (!Object.keys(validFields).includes(orderBy)) {
        throw new Error(`Invalid orderBy field. Supported fields: ${Object.keys(validFields).join(', ')}`);
    }

    if (!['ASC', 'DESC'].includes(orderDirection)) {
        throw new Error(`Invalid orderDirection. Supported directions: ASC, DESC`);
    }

    let paginatedQuery = '';
    const values: (string | number)[] = [ACTIVE_REPORT_STATUS, limit, offset];

    // If username is provided, use the filtered query
    if (username && username.length > 0) {
        paginatedQuery = `
        SELECT
          p.id,
          p.user_id,
          p.content,
          p.file_url,
          p.file_size,
          p.media_type,
          p.is_active,
          p.is_edited,
          p.status,
          p.created_at,
          p.updated_at,
          u.username,
          u.email,
          COALESCE(
            SUM(CASE WHEN r.status = $1 THEN 1 ELSE 0 END),
            0
          ) AS active_reports,
          COUNT(r.id) AS total_reports
        FROM posts p
        JOIN users u
          ON u.id = p.user_id
        JOIN reports r
          ON r.reported_content_id = p.id
        WHERE LOWER(u.username) = LOWER($4)
        GROUP BY
          p.id,
          p.user_id,
          p.content,
          p.file_url,
          p.file_size,
          p.media_type,
          p.is_active,
          p.is_edited,
          p.status,
          p.created_at,
          p.updated_at,
          u.username,
          u.email
        ORDER BY ${validFields[orderBy]} ${orderDirection}
        LIMIT $2 OFFSET $3;
        `;
        values.push(username);
    } else {
        // Normal query without username filtering
        paginatedQuery = `
        SELECT
          p.id,
          p.user_id,
          p.content,
          p.file_url,
          p.file_size,
          p.media_type,
          p.is_active,
          p.is_edited,
          p.status,
          p.created_at,
          p.updated_at,
          u.username,
          u.email,
          COALESCE(
            SUM(CASE WHEN r.status = $1 THEN 1 ELSE 0 END),
            0
          ) AS active_reports,
          COUNT(r.id) AS total_reports
        FROM posts p
        JOIN users u
          ON u.id = p.user_id
        JOIN reports r
          ON r.reported_content_id = p.id
        GROUP BY
          p.id,
          p.user_id,
          p.content,
          p.file_url,
          p.file_size,
          p.media_type,
          p.is_active,
          p.is_edited,
          p.status,
          p.created_at,
          p.updated_at,
          u.username,
          u.email
        ORDER BY ${validFields[orderBy]} ${orderDirection}
        LIMIT $2 OFFSET $3;
        `;
    }

    // Debugging: See the query being executed
    //console.log("Executing Query:", paginatedQuery);
    //console.log("With Values:", values);

    // Execute the query
    const result: QueryResult<ReportedPost> = await client.query(paginatedQuery, values);

    if (result.rows.length === 0) {
        return { message: 'No reported posts in this page range.' };
    }

    return result.rows;
};


/**
 * Retrieves all reported posts (no pagination).
 */
export const getAllReportedPosts = async (): Promise<ReportedPost[] | { message: string }> => {
    const query = `
    SELECT
      p.id,
      p.user_id,
      p.content,
      p.file_url,
      p.file_size,
      p.media_type,
      p.is_active,
      p.is_edited,
      p.status,
      p.created_at,
      p.updated_at,
      u.username,
      u.email,
      COALESCE(
        SUM(CASE WHEN r.status = $1 THEN 1 ELSE 0 END),
        0
      ) AS active_reports,
      COUNT(r.id) AS total_reports
    FROM posts p
    JOIN users u
      ON u.id = p.user_id
    JOIN reports r
      ON r.reported_content_id = p.id
    GROUP BY
      p.id,
      p.user_id,
      p.content,
      p.file_url,
      p.file_size,
      p.media_type,
      p.is_active,
      p.is_edited,
      p.status,
      p.created_at,
      p.updated_at,
      u.username,
      u.email
    ORDER BY p.created_at DESC
    `;
    const values = [ACTIVE_REPORT_STATUS];
    const res: QueryResult<ReportedPost> = await client.query(query, values);

    if (res.rows.length === 0) {
        return { message: 'No hay publicaciones reportadas en este momento.' };
    }
    return res.rows;
};

/**
 * Returns the count of unique reported posts.
 */
export const getReportedPostsCount = async (username?: string): Promise<number> => {
    let countQuery = `
        SELECT COUNT(DISTINCT p.id) AS reported_count
        FROM posts p
        JOIN reports r
          ON r.reported_content_id = p.id
    `;
    const values: string[] = [];
    if (username) {
        countQuery += `
        JOIN users u
          ON u.id = p.user_id
        WHERE LOWER(u.username) = LOWER($1)
        `;
        values.push(username);
    }
    const result = await client.query<{ reported_count: string }>(countQuery, values);
    return parseInt(result.rows[0].reported_count, 10);
};
/**
 * Soft deletes a reported post and updates all its associated reports.
 * 
 * @param postId - ID of the post to delete
 * @returns Object containing a message indicating the operation result
 */
export const deleteReportedPost = async (postId: string): Promise<{message: string}> => {
  try {
    await client.query('BEGIN;');
    
    await client.query(
      'UPDATE posts SET is_active = false WHERE id = $1',
      [postId]
    );
    
    await client.query(
      'UPDATE reports SET status = 0 WHERE reported_content_id = $1',
      [postId]
    );
    
    await client.query('COMMIT;');
    
    return { message: 'Post and its reports have been successfully deactivated' };
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  }
}
/**
 * Restores a reported post by setting its is_active status to true
 * 
 * @param postId - ID of the post to restore
 * @returns Object containing a message indicating the operation result
 */
export const restoreReportedPost = async (postId: string): Promise<{message: string}> => {
  try {
    await client.query('BEGIN;');
    
    await client.query(
      'UPDATE posts SET is_active = true WHERE id = $1',
      [postId]
    );
    
    await client.query(
      'UPDATE reports SET status = 1 WHERE reported_content_id = $1',
      [postId]
    );
    
    await client.query('COMMIT;');
    
    return { message: 'Post has been successfully restored' };
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  }
}