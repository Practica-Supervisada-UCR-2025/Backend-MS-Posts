import request from 'supertest';
import express from 'express';

// Mock _before_ you import the router so that authenticateJWT
// and the controller are already jest-tracked when the routes load.
jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/commentCrud.controller');

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { getPostCommentsController } from '../../src/features/posts/controllers/commentCrud.controller';
import commentRoutes from '../../src/features/posts/routes/post.routes';

const app = express();
app.use(express.json());
app.use(commentRoutes);

describe('GET /posts/:postId/comments', () => {
    const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
    const mockedController     = jest.mocked(getPostCommentsController);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 when authenticated', async () => {
        // simulate successful JWT auth
        mockedAuthenticateJWT.mockImplementation((req, res, next) => next());

        // simulate controller sending a 200
        mockedController.mockImplementation((req, res) => {
            res.status(200).json({ message: 'ok' });
        });

        const res = await request(app)
            .get('/posts/1/comments')              // <–– note leading slash
            .set('Authorization', 'Bearer token')
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'ok' });
    });

    it('should return 401 when not authenticated', async () => {
        // simulate auth failure
        mockedAuthenticateJWT.mockImplementation((req, res) => {
            res.status(401).json({ message: 'Unauthorized' });
        });

        const res = await request(app)
            .get('/posts/49f40bce-9a9b-448e-b4ff-59193d4e62lk/comments')  // <–– leading slash
            .query({ startTime: new Date().toISOString(), index: 0 });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });
});
