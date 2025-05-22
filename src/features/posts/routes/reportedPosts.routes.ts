import { Router, RequestHandler } from 'express';
import { getUserPostsController } from '../controllers/userPosts.controller';
import { deleteReportedPostController } from '../controllers/reportedPosts.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';

const router = Router();

router.get('/posts/reported', authenticateJWT, getUserPostsController as RequestHandler);
router.post('/admin/reported/delete', authenticateJWT, deleteReportedPostController as RequestHandler);


export default router;