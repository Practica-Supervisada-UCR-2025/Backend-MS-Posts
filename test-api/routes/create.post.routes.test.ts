import request from 'supertest';
import express from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { createPostController } from '../../src/features/posts/controllers/postCrud.controller';
import postsRoutes from '../../src/features/posts/routes/post.routes';

const app = express();
app.use(express.json());
app.use(postsRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/posts/controllers/postCrud.controller');

describe('POST /posts/newPost', () => {
  const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
  const mockedCreatePostController = jest.mocked(createPostController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and created post when authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res, next) => next());
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
  });

  it('should return 401 when not authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const response = await request(app)
      .post('/posts/newPost')
      .send({ content: 'Hola mundo' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });
});