import request from 'supertest';
import express, { RequestHandler, NextFunction, Response } from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { getReportedPostsController } from '../../src/features/posts/controllers/reportedPosts.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';

// create a test app
const app = express();
app.use(express.json());
app.use(postsRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/getReportedPosts.controller');

describe('GET /posts/reported', () => {
    const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
    const mockedGetReportedPostsController = jest.mocked(getReportedPostsController);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 and reported posts when authenticated', async () => {
        // middleware just calls next()
        mockedAuthenticateJWT.mockImplementation(((req, res, next) => next()) as RequestHandler);

        // controller must now take 3 args and return a Promise
        mockedGetReportedPostsController.mockImplementation(
            async (
                req: any,
                res: Response,
                next: NextFunction
            ): Promise<void> => {
                // you can await things here, but for the mock it's synchronous
                res.status(200).json({
                    message: 'Reported posts fetched successfully',
                    posts: [{ id: 1, title: 'Spam post', reason: 'Inappropriate' }],
                    metadata: {
                        totalPosts: 1,
                        totalPages: 1,
                        currentPage: 1,
                    },
                });
            }
        );

        const res = await request(app)
            .get('/posts/reported')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            message: 'Reported posts fetched successfully',
            posts: [{ id: 1, title: 'Spam post', reason: 'Inappropriate' }],
            metadata: {
                totalPosts: 1,
                totalPages: 1,
                currentPage: 1,
            },
        });
    });

    it('should return 401 when not authenticated', async () => {
        // middleware rejects
        mockedAuthenticateJWT.mockImplementation(((req, res) => {
            res.status(401).json({ message: 'Unauthorized' });
        }) as RequestHandler);

        const res = await request(app).get('/posts/reported');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });
});
