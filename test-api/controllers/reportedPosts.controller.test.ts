import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import * as reportedPostsService from '../../src/features/posts/services/reportedPosts.service';
import reportedPostsRoutes from '../../src/features/posts/routes/reportedPosts.routes';
import { BadRequestError } from '../../src/utils/errors/api-error';

jest.mock('../../src/features/posts/services/reportedPosts.service');


jest.mock('../../src/features/middleware/authenticate.middleware', () => {
    const { UnauthorizedError } = require('../../src/utils/errors/api-error');
    return {
        authenticateJWT: (req: any, res: any, next: any) => {
            const auth = req.headers.authorization as string;
            if (auth?.startsWith('Bearer valid-token')) {
                // For reported posts routes, set admin role
                if (req.path.startsWith('/posts/reported') || req.path.startsWith('/admin/reported')) {
                    req.user = { uuid: 'admin-uuid', email: 'admin@test.com', role: 'admin' };
                } else {
                    // For other routes, set user role
                    req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'user' };
                }
                return next();
            }
            if (auth?.startsWith('Bearer wrong-role')) {
                // For reported posts routes, set user role (wrong)
                if (req.path.startsWith('/posts/reported') || req.path.startsWith('/admin/reported')) {
                    req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'user' };
                } else {
                    // For other routes, set admin role (wrong)
                    req.user = { uuid: 'admin-uuid', email: 'admin@test.com', role: 'admin' };
                }
                return next();
            }
            return next(new UnauthorizedError('Unauthorized'));
        },
    };
});

describe('GET /posts/reported → reportedPostsController', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/', postsRoutes);
        app.use(errorHandler as ErrorRequestHandler);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockResult = {
        message: 'Reported posts fetched successfully',
        posts: [
            {
                id: '1',
                reporter_id: 'user-uuid',
                reported_post_id: 'post-42',
                reason: 'Spam',
                created_at: '2025-05-02T10:00:00.000Z',
            },
        ],
        metadata: {
            totalPosts: 1,
            totalPages: 1,
            currentPage: 1,
        },
    };

    it(' returns 200 + body when authenticated and query is valid', async () => {
        (reportedPostsService.getReportedPosts as jest.Mock).mockResolvedValueOnce(mockResult);

        const res = await request(app)
            .get('/posts/reported')
            .set('Authorization', 'Bearer valid-token')
            .query({ page: 1, limit: 10 })
            .expect(200);

        expect(res.body).toEqual(mockResult);
        expect(reportedPostsService.getReportedPosts).toHaveBeenCalledWith(1, 10, "date", "DESC", undefined);
    });

    it(' returns 401 when no Authorization header', async () => {
        const res = await request(app)
            .get('/posts/reported')
            .expect(401);

        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it(' returns 401 when user has wrong role', async () => {
        const res = await request(app)
            .get('/posts/reported')
            .set('Authorization', 'Bearer wrong-role')
            .query({ page: 1, limit: 10 })
            .expect(401);

        expect(res.body).toEqual({
            message: 'User with role "admin" is required to access reported posts.',
        });
    });

    it(' returns 400 when query params fail validation', async () => {
        const res = await request(app)
            .get('/posts/reported')
            .set('Authorization', 'Bearer valid-token')
            .query({ page: 'abc', limit: -5 })
            .expect(400);

        expect(res.body).toEqual({
            message: 'Validation error',
            details: expect.any(Array),
        });
    });
});

describe('POST /admin/reported/delete → deleteReportedPostController', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/', reportedPostsRoutes);
        app.use(errorHandler as ErrorRequestHandler);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockDeleteResult = {
        success: true,
        message: 'Post and its reports have been successfully deactivated'
    };

    const validRequestData = {
        postId: '123',
        authorUsername: 'author123',
        moderatorUsername: 'moderator123'
    };

    it('returns 200 + success message when admin deletes post', async () => {
        (reportedPostsService.deleteReportedPost as jest.Mock).mockResolvedValueOnce(mockDeleteResult);

        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send(validRequestData)
            .expect(200);

        expect(res.body).toEqual(mockDeleteResult);
        expect(reportedPostsService.deleteReportedPost).toHaveBeenCalledWith(validRequestData);
    });

    it('returns 401 when no Authorization header', async () => {
        const res = await request(app)
            .post('/admin/reported/delete')
            .send(validRequestData)
            .expect(401);

        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('returns 403 when user is not admin', async () => {
        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer wrong-role')
            .send(validRequestData)
            .expect(403);

        expect(res.body).toEqual({
            success: false,
            message: 'Access denied: You do not have permission to perform this action'
        });
    });

    it('returns 400 when postId is missing', async () => {
        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send({})
            .expect(400);

        expect(res.body).toEqual({
            success: false,
            message: 'Validation error'
        });
    });

    it('returns 400 when service throws error', async () => {
        const errorMessage = 'Failed to delete post';
        (reportedPostsService.deleteReportedPost as jest.Mock).mockResolvedValueOnce({
            success: false,
            message: errorMessage
        });

        const res = await request(app)
            .post('/admin/reported/delete')
            .set('Authorization', 'Bearer valid-token')
            .send(validRequestData)
            .expect(400);

        expect(res.body).toEqual({
            success: false,
            message: errorMessage
        });
    });
});

describe('POST /admin/reported/restore → restoreReportedPostController', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/', reportedPostsRoutes);
        app.use(errorHandler as ErrorRequestHandler);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockRestoreResult = {
        success: true,
        message: 'Post has been successfully restored'
    };

    const validRequestData = {
        postId: '123',
        authorUsername: 'author123',
        moderatorUsername: 'moderator123'
    };

    it('returns 200 + success message when admin restores post', async () => {
        (reportedPostsService.restoreReportedPost as jest.Mock).mockResolvedValueOnce(mockRestoreResult);

        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer valid-token')
            .send(validRequestData)
            .expect(200);

        expect(res.body).toEqual(mockRestoreResult);
        expect(reportedPostsService.restoreReportedPost).toHaveBeenCalledWith(validRequestData);
    });

    it('returns 401 when no Authorization header', async () => {
        const res = await request(app)
            .post('/admin/reported/restore')
            .send(validRequestData)
            .expect(401);

        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('returns 403 when user is not admin', async () => {
        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer wrong-role')
            .send(validRequestData)
            .expect(403);

        expect(res.body).toEqual({
            success: false,
            message: 'Access denied: You do not have permission to perform this action'
        });
    });

    it('returns 400 when postId is missing', async () => {
        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer valid-token')
            .send({})
            .expect(400);

        expect(res.body).toEqual({
            success: false,
            message: 'Validation error'
        });
    });

    it('returns 400 when validation fails with multiple errors', async () => {
        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer valid-token')
            .send({})
            .expect(400);

        expect(res.body).toEqual({
            success: false,
            message: 'Validation error'
        });
    });

    it('returns 500 when service throws unexpected error', async () => {
        (reportedPostsService.restoreReportedPost as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer valid-token')
            .send(validRequestData)
            .expect(500);

        expect(res.body).toEqual({
            message: 'Internal Server Error'
        });
    });

    it('returns 400 when service returns validation error', async () => {
        (reportedPostsService.restoreReportedPost as jest.Mock).mockRejectedValueOnce(new BadRequestError('Invalid post ID'));

        const res = await request(app)
            .post('/admin/reported/restore')
            .set('Authorization', 'Bearer valid-token')
            .send(validRequestData)
            .expect(400);

        expect(res.body).toEqual({
            message: 'Invalid post ID'
        });
    });
});
