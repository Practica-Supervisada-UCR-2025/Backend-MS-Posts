import request from 'supertest';
import express, { RequestHandler, NextFunction, Response, Request } from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { deleteReportedPostController } from '../../src/features/posts/controllers/reportedPosts.controller';
import reportedPostsRoutes from '../../src/features/posts/routes/reportedPosts.routes';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';

// create a test app
const app = express();
app.use(express.json());
app.use(reportedPostsRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/reportedPosts.controller');

describe('POST /admin/reported/delete', () => {
    const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
    const mockedDeleteReportedPostController = jest.mocked(deleteReportedPostController);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 when post is successfully deleted', async () => {
        // middleware just calls next()
        mockedAuthenticateJWT.mockImplementation(((req: AuthenticatedRequest, res, next) => {
            req.user = { role: 'admin', email: 'admin@test.com', uuid: '123' };
            next();
        }) as RequestHandler);

        // mock controller response
        mockedDeleteReportedPostController.mockImplementation(
            async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
                res.status(200).json({
                    success: true,
                    message: 'Post and its reports have been successfully deactivated'
                });
            }
        );

        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send({ postId: '123' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Post and its reports have been successfully deactivated'
        });
    });

    it('should return 401 when not authenticated', async () => {
        // middleware rejects
        mockedAuthenticateJWT.mockImplementation(((req, res) => {
            res.status(401).json({ message: 'Unauthorized' });
        }) as RequestHandler);

        const res = await request(app)
            .post('/admin/reported/delete')
            .send({ postId: '123' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return 403 when user is not admin', async () => {
        // middleware passes but controller checks role
        mockedAuthenticateJWT.mockImplementation(((req: AuthenticatedRequest, res, next) => {
            req.user = { role: 'user', email: 'user@test.com', uuid: '456' };
            next();
        }) as RequestHandler);

        // mock controller to handle non-admin role
        mockedDeleteReportedPostController.mockImplementation(
            async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
                if (req.user.role !== 'admin') {
                    res.status(403).json({
                        success: false,
                        message: 'Access denied: You do not have permission to perform this action'
                    });
                    return;
                }
            }
        );

        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send({ postId: '123' });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({
            success: false,
            message: 'Access denied: You do not have permission to perform this action'
        });
    });

    it('should return 400 when postId is missing', async () => {
        // middleware passes with admin role
        mockedAuthenticateJWT.mockImplementation(((req: AuthenticatedRequest, res, next) => {
            req.user = { role: 'admin', email: 'admin@test.com', uuid: '123' };
            next();
        }) as RequestHandler);

        // mock controller to handle validation error
        mockedDeleteReportedPostController.mockImplementation(
            async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
                if (!req.body.postId) {
                    res.status(400).json({
                        success: false,
                        message: 'Validation error'
                    });
                    return;
                }
            }
        );

        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
}); 