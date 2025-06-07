import { Router ,RequestHandler} from 'express';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { createPostController} from '../controllers/postCrud.controller';

const router = Router();

// Create a new comment on a post (protected by JWT)
router.post('/posts/newCommment', authenticateJWT, createPostController as RequestHandler);

export default router;