import { Router, RequestHandler } from 'express';
import { getUserPostsController } from '../controllers/getPosts.controller';
import { deleteReportedPostController, restoreReportedPostController, reportPostController } from '../controllers/reportedPosts.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';

const router = Router();

router.get('/posts/reported', authenticateJWT, getUserPostsController as RequestHandler);

/**
 * @route POST /admin/reported/delete
 * @description Delete a reported post (admin only)
 * @middleware authenticateJWT - Ensures user is authenticated and has admin role
 * @middleware deleteReportedPostController - Handles the deletion request
 */
router.post('/admin/reported/delete', authenticateJWT, deleteReportedPostController as RequestHandler);

/**
 * @route POST /admin/reported/restore
 * @description Restore a reported post (admin only)
 * @middleware authenticateJWT - Ensures user is authenticated and has admin role
 * @middleware restoreReportedPostController - Handles the restoration request
 */
router.post('/admin/reported/restore', authenticateJWT, restoreReportedPostController as RequestHandler);
/**
 * @route POST /posts/report
 * @description Report a user post
 * @middleware authenticateJWT - Ensures user is authenticated
 * @middleware reportPostController - Handles the report request
 */
router.post('/posts/report', authenticateJWT, reportPostController as RequestHandler);

export default router;
