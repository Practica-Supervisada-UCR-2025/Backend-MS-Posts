import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import * as reportedPostsService from '../../src/features/posts/services/reportedPosts.service';

// Mock the service function
jest.mock('../../src/features/posts/services/reportedPosts.service');

// Fix the mock of the auth middleware to simulate role properly
jest.mock('../../src/features/middleware/authenticate.middleware', () => {
    const { UnauthorizedError } = require('../../src/utils/errors/api-error');
    return {
        authenticateJWT: (req: any, res: any, next: any) => {
            const auth = req.headers.authorization as string;

            if (auth?.startsWith('Bearer valid-token')) {
                // Correct role: admin
                req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'admin' };
                return next();
            }

            if (auth?.startsWith('Bearer wrong-role')) {
                // Incorrect role: user
                req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'user' };
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
