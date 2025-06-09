import { Router ,RequestHandler} from 'express';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { createCommentController, getPostCommentsController } from '../controllers/commentCrud.controller';

const router = Router();

// Create a new comment on a post (protected by JWT)
router.post('/posts/newComment', authenticateJWT, createCommentController as RequestHandler);

router.get('/posts/:postId/comments', authenticateJWT, getPostCommentsController as RequestHandler);

export default router;