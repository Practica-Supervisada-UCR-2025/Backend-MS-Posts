import { number } from 'yup';
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

export const findFeedPosts = async (date: Date, limit: number) => {
  const query = `
    SELECT posts.id, posts.user_id, posts.content, posts.file_url, posts.created_at, posts.media_type, users.username, users.profile_picture
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.created_at < $1 AND posts.is_active = true AND posts.status = 1
    ORDER BY posts.created_at DESC
    LIMIT $2;
  `;
  const values = [date, limit];
  const res = await client.query(query, values);
  return res.rows;
}

// Add function to fetch total visible posts
export const getTotalVisiblePosts = async (date: Date) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM posts
    WHERE posts.created_at < $1 AND posts.is_active = true AND posts.status = 1;
  `;
  const values = [date];
  const res = await client.query(query, values);
  return res.rows[0]?.total || 0;
};