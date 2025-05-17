import client from '../../../config/database';
import { Post } from '../interfaces/posts.entities.interface';

export const findByEmailUser = async (email: string) => {
  const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

export const createPost = async (post: Post) => {
  
}
