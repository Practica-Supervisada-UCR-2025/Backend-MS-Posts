import request from 'supertest';
import express, { RequestHandler } from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { getPostCommentsController } from '../../src/features/posts/controllers/commentCrud.controller';
import commentRoutes from '../../src/features/posts/routes/comment.routes';

const app = express();
app.use(express.json());
app.use(commentRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/commentCrud.controller');

describe('GET /posts/:postId/comments', () => {
    const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
    const mockedController = jest.mocked(getPostCommentsController);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 when authenticated', async () => {
        mockedAuthenticateJWT.mockImplementation((req, res, next) => next() as unknown as RequestHandler);
        mockedController.mockImplementation((req, res) => {
            res.status(200).json({ message: 'ok' });
        });

        const res = await request(app)
            .get('/posts/1/comments')
            .set('Authorization', 'Bearer token')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'ok' });
    });

    it('should return 401 when not authenticated', async () => {
        mockedAuthenticateJWT.mockImplementation((req, res) => {
            res.status(401).json({ message: 'Unauthorized' });
        });

        const res = await request(app)
            .get('/posts/1/comments')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });
});