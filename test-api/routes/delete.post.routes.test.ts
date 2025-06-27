// test-api/routes/delete.post.routes.test.ts

import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';

// Hoist these mocks BEFORE importing anything that uses them
jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/middleware/suspension.middleware');
jest.mock('../../src/features/posts/controllers/post.controller');

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { deleteOwnPostController } from '../../src/features/posts/controllers/post.controller';
import postRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';

const app = express();
app.use(express.json());
app.use('/api', postRoutes);
// mount your global error handler
app.use(errorHandler as ErrorRequestHandler);

describe('DELETE /api/user/posts/delete/:postId', () => {
  const mockedAuth       = jest.mocked(authenticateJWT);
  const mockedSuspend    = jest.mocked(checkUserSuspension);
  const mockedDeleteCtrl = jest.mocked(deleteOwnPostController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200 → calls controller for authenticated & not suspended user', async () => {
    // stub auth + suspension
    mockedAuth.mockImplementation((req, res, next) => {
      req.user = { uuid: 'user-123' };
      next();
    });
    mockedSuspend.mockImplementation((req, res, next) => next());

    // stub controller
    mockedDeleteCtrl.mockImplementation((req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Post successfully deleted.',
      });
    });

    const res = await request(app)
        .delete('/api/user/posts/delete/post-123')
        .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      message: 'Post successfully deleted.',
    });

    // verify each layer ran
    expect(mockedAuth).toHaveBeenCalled();
    expect(mockedSuspend).toHaveBeenCalled();
    expect(mockedDeleteCtrl).toHaveBeenCalledWith(
        expect.objectContaining({ params: { postId: 'post-123' } }),
        expect.anything(),
        expect.anything()
    );
  });

  it('401 → blocks unauthenticated users', async () => {
    // auth fails; suspension & controller never called
    mockedAuth.mockImplementation((req, res) => {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    });

    const res = await request(app)
        .delete('/api/user/posts/delete/post-123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Unauthorized',
    });

    expect(mockedAuth).toHaveBeenCalled();
    expect(mockedSuspend).not.toHaveBeenCalled();
    expect(mockedDeleteCtrl).not.toHaveBeenCalled();
  });
});
