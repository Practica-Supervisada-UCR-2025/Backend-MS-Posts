import { Router ,RequestHandler} from 'express';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { getUserPostsController, getPostsByUserIdController, getPostByIdController } from '../controllers/getPosts.controller';
import { deleteOwnPostController } from '../controllers/post.controller';
import { getReportedPostsController } from "../controllers/reportedPosts.controller";
import { createPostController, getPostsFeedController } from '../controllers/postCrud.controller';

const router = Router();

// GET
// Get user posts route (protected by JWT)
router.get('/user/posts/mine', authenticateJWT, getUserPostsController as RequestHandler);

// Get posts for a specific user by UUID route (protected by JWT)
router.get('/posts/user/:uuid', authenticateJWT, getPostsByUserIdController as RequestHandler);

// Get all reported posts route (protected by JWT)
router.get('/posts/reported', authenticateJWT, getReportedPostsController as RequestHandler);

// Get posts feed route (protected by JWT)
router.get('/posts/feed', authenticateJWT, getPostsFeedController as RequestHandler)

// DELETE
// Delete own post route (protected by JWT)
router.delete('/user/posts/delete/:postId', authenticateJWT, deleteOwnPostController as unknown as RequestHandler);

// POST
// Create a new post (protected by JWT)
router.post('/posts/newPost', authenticateJWT, createPostController as RequestHandler);;

// Get post by ID route (protected by JWT)
router.get('/user/posts/:postId', authenticateJWT, getPostByIdController as RequestHandler);

export default router;
