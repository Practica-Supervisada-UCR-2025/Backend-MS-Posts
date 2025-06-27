// test-api/routes/create.post.routes.test.ts

import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/middleware/suspension.middleware');
jest.mock('../../src/features/posts/controllers/postCrud.controller');

import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { createPostController } from '../../src/features/posts/controllers/postCrud.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import { ForbiddenError } from '../../src/utils/errors/api-error';

describe('POST /posts/newPost', () => {
  // Create and configure the test app once per suite
  const app = express();
  app.use(express.json());
  app.use(postsRoutes);
  app.use(errorHandler as ErrorRequestHandler);

  // Grab typed mocks of each function
  const mockedAuthenticateJWT      = jest.mocked(authenticateJWT);
  const mockedSuspension           = jest.mocked(checkUserSuspension);
  const mockedCreatePostController = jest.mocked(createPostController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('201 → when authenticated & not suspended', async () => {
    // simulate passing auth + suspension
    mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
    mockedSuspension.mockImplementation((req, res, next) => next());

    // stubbed controller response
    mockedCreatePostController.mockImplementation((req, res) => {
      res.status(201).json({
        message: 'Post created successfully',
        post: {
          id: 'uuid',
          content: 'Hola mundo',
          user_id: 1,
          file_url: null,
          file_size: null,
          media_type: null,
          is_active: true,
          is_edited: false,
          status: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      });
    });

    const response = await request(app)
        .post('/posts/newPost')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Hola mundo' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Post created successfully',
      post: {
        id: 'uuid',
        content: 'Hola mundo',
        user_id: 1,
        file_url: null,
        file_size: null,
        media_type: null,
        is_active: true,
        is_edited: false,
        status: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    });

    // verify each layer ran
    expect(mockedAuthenticateJWT).toHaveBeenCalled();
    expect(mockedSuspension).toHaveBeenCalled();
    expect(mockedCreatePostController).toHaveBeenCalled();
  });

  it('401 → when not authenticated', async () => {
    // simulate auth failure
    mockedAuthenticateJWT.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const response = await request(app)
        .post('/posts/newPost')
        .send({ content: 'Hola mundo' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });

    // suspension & controller should never get called
    expect(mockedSuspension).not.toHaveBeenCalled();
    expect(mockedCreatePostController).not.toHaveBeenCalled();
  });

  it('403 → when user is suspended', async () => {
    // auth passes, but suspension fails
    mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
    mockedSuspension.mockImplementation((req, res, next) =>
        next(new ForbiddenError('User suspended'))
    );

    const response = await request(app)
        .post('/posts/newPost')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Hola mundo' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'User suspended' });

    // controller should never run
    expect(mockedCreatePostController).not.toHaveBeenCalled();
  });
});
