import client from '../../../config/database';

// Find a post by ID
export const findPostById = async (postId: string) => {
    const res = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
    return res.rows.length > 0 ? res.rows[0] : null;
};

// Soft delete the post (set is_active to false)
export const deleteOwnPostRepository = async (postId: string) => {
    await client.query('UPDATE posts SET is_active = false WHERE id = $1', [postId]);
};
