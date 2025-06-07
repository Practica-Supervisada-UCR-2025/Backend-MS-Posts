import client from '../../../config/database';
import { QueryResult } from 'pg';

export interface PostComment {
    id: string;
    content: string;
    username: string;
    created_at: Date;
}

export const getCommentsByPostId = async (
    postId: string,
    startTime: Date,
    offset: number,
    limit: number = 5
): Promise<PostComment[]> => {
    const query = `
    SELECT c.id, c.content, u.username, c.created_at
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = $1 AND c.created_at >= $2
    ORDER BY c.created_at ASC
    LIMIT $3 OFFSET $4
  `;
    const values = [postId, startTime, limit, offset * limit];
    const result: QueryResult<PostComment> = await client.query(query, values);
    return result.rows;
};

export const countCommentsByPostId = async (
    postId: string
): Promise<number> => {
    const result = await client.query<{ count: string }>(
        'SELECT COUNT(*) FROM comments WHERE post_id = $1',
        [postId]
    );
    return parseInt(result.rows[0].count, 10);
};