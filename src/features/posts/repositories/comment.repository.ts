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
        SELECT
            c.id,
            c.content,
            c.user_id,
            c.post_id,
            c.file_url,
            c.file_size,
            c.media_type,
            c.is_active,
            c.is_edited,
            c.status,
            c.created_at,
            c.updated_at,
            u.username,
            users.profile_picture
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

export const createCommentDB = async (comment: Partial<any>) => {
    const query = `
        INSERT INTO comments (
            id, content, user_id, post_id, file_url, file_size, media_type, is_active, is_edited, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *;
    `;
    const values = [
        comment.id,
        comment.content,
        comment.user_id,
        comment.post_id,
        comment.file_url ?? null,
        comment.file_size ?? null,
        comment.media_type ?? null,
        comment.is_active ?? true,
        comment.is_edited ?? false,
        comment.status ?? 0,
    ];
    const res = await client.query(query, values);
    return res.rows[0];
};