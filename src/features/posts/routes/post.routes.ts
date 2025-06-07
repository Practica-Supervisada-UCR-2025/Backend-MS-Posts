import { Router ,RequestHandler} from 'express';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { getUserPostsController } from '../controllers/getPosts.controller';
import { deleteOwnPostController } from '../controllers/post.controller';
import { getReportedPostsController } from "../controllers/reportedPosts.controller";
import { createPostController, getPostsFeedController } from '../controllers/postCrud.controller';

const router = Router();

// Get user posts route (protected by JWT)
router.get('/user/posts/mine', authenticateJWT, getUserPostsController as RequestHandler);

// Delete own post route (protected by JWT)
router.delete('/user/posts/delete/:postId', authenticateJWT, deleteOwnPostController as unknown as RequestHandler);

// Get all reported posts route (protected by JWT)
router.get('/posts/reported', authenticateJWT, getReportedPostsController as RequestHandler);

// Create a new post (protected by JWT)
router.post('/posts/newPost', authenticateJWT, createPostController as RequestHandler);

// Get posts feed route (protected by JWT)
router.get('/posts/feed', authenticateJWT, getPostsFeedController as RequestHandler);

// Create a new comment on a post (protected by JWT)
router.post('/posts/newCommment', authenticateJWT, createPostController as RequestHandler);

export default router;
