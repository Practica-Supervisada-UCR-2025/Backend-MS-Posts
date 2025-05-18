import client from '../../../config/database';
import { ReportedPost } from '../interfaces/reportedPost.entities.interface';
import { QueryResult } from 'pg';


// { NO_ACTIVE = 0, ACTIVE = 1 }
const ACTIVE_REPORT_STATUS = 1;

/**
 * Retrieves paginated reported posts.
 */
export const getReportedPostsPaginated = async (
    limit: number,
    offset: number
): Promise<ReportedPost[] | { message: string }> => {
    const paginatedQuery = `
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
    LIMIT $2
    OFFSET $3;
  `;
    const values = [ACTIVE_REPORT_STATUS, limit, offset];
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
    ORDER BY p.created_at DESC;
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
export const getReportedPostsCount = async (): Promise<number> => {
    const countQuery = `
    SELECT COUNT(DISTINCT p.id) AS reported_count
    FROM posts p
    JOIN reports r
      ON r.reported_content_id = p.id;
  `;
    const result = await client.query<{ reported_count: string }>(countQuery);
    return parseInt(result.rows[0].reported_count, 10);
};

