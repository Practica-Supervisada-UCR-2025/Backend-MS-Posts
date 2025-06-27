// test-api/routes/comment.routes.test.ts

import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';

// Mocks must come *before* the imports of your router and middleware
jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/middleware/suspension.middleware');
jest.mock('../../src/features/posts/controllers/commentCrud.controller');

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { getPostCommentsController } from '../../src/features/posts/controllers/commentCrud.controller';
import commentRoutes from '../../src/features/posts/routes/comment.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import { ForbiddenError } from '../../src/utils/errors/api-error';

const app = express();
app.use(express.json());
app.use(commentRoutes);
// ← mount your error handler so next(err) gets turned into a JSON response
app.use(errorHandler as ErrorRequestHandler);

describe('GET /posts/:postId/comments', () => {
    const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
    const mockedSuspension       = jest.mocked(checkUserSuspension);
    const mockedController       = jest.mocked(getPostCommentsController);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('200 → when authenticated & not suspended', async () => {
        mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
        mockedSuspension.mockImplementation((req, res, next) => next());
        mockedController.mockImplementation((req, res) => {
            res.status(200).json({ message: 'ok' });
        });

        const res = await request(app)
            .get('/posts/1/comments')
            .set('Authorization', 'Bearer valid-token')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'ok' });
    });

    it('401 → when not authenticated', async () => {
        mockedAuthenticateJWT.mockImplementation((req, res) => {
            res.status(401).json({ message: 'Unauthorized' });
        });

        const res = await request(app)
            .get('/posts/abcdef/comments')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('403 → when user is suspended', async () => {
        mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
        mockedSuspension.mockImplementation((req, res, next) =>
            next(new ForbiddenError('User suspended'))
        );

        const res = await request(app)
            .get('/posts/1/comments')
            .set('Authorization', 'Bearer valid-token')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ message: 'User suspended' });
    });
});
