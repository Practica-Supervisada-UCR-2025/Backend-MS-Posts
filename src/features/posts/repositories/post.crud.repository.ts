import client from '../../../config/database';
import { Post } from '../interfaces/posts.entities.interface';

export const findByEmailUser = async (email: string) => {
  const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

export const createPostDB = async (post: Partial<Post>) => {
  const query = `
    INSERT INTO posts (id, content, user_id, file_url, file_size, media_type, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING *;
  `;
  const values = [
    post.id,
    post.content,
    post.user_id,
    post.file_url ?? null,
    post.file_size ?? null,
    post.media_type ?? null,
  ];
  const res = await client.query(query, values);
  return res.rows[0];
}