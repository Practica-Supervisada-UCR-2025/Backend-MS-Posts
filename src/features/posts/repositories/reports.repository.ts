// src/repositories/reports.repository.ts
import client from '../../../config/database';

/**
 * Fetch sorted reported posts from the database
 * @param orderBy - Field to sort by (created_at, report_count, username)
 * @param orderDirection - Sort direction (asc or desc)
 * @param page - Page number for pagination
 * @param limit - Number of results per page
 * @returns Array of reported posts
 */
export const getSortedReports = async (
    orderBy: string,
    orderDirection: string,
    page: number,
    limit: number
) => {
    const offset = (page - 1) * limit;

    // SQL Query with sorting and pagination
    const query = `
        SELECT * 
        FROM public.reports 
        WHERE content_type = 'post' 
        ORDER BY ${orderBy} ${orderDirection} 
        LIMIT $1 OFFSET $2;
    `;

    const res = await client.query(query, [limit, offset]);
    return res.rows;
};
