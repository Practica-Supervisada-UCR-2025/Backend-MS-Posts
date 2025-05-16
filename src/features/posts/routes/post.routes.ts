import { Router ,RequestHandler} from 'express';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { getUserPostsController } from '../controllers/getPosts.controller';
import { deleteOwnPostController } from '../controllers/post.controller';

const router = Router();

// Get user posts route (protected by JWT)
router.get('/user/posts/mine', authenticateJWT, getUserPostsController as RequestHandler);

// Delete own post route (protected by JWT)
router.delete('/user/posts/delete', authenticateJWT, deleteOwnPostController as RequestHandler);

export default router;
