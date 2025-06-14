import { Router, RequestHandler } from 'express';
import { createReportController } from '../controllers/create.report.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';

const router = Router();

router.post('/posts/report', authenticateJWT, createReportController as RequestHandler);

export default router;
