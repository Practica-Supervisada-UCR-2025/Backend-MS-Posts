import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import postsRoutes from '../../src/features/posts/routes/post.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import * as postCrudService from '../../src/features/posts/services/postCrud.service';

jest.mock('../../src/features/posts/services/postCrud.service');

jest.mock('../../src/features/middleware/authenticate.middleware', () => {
  const { UnauthorizedError } = require('../../src/utils/errors/api-error');
  return {
    authenticateJWT: (req: any, res: any, next: any) => {
      const auth = req.headers.authorization as string;
      if (auth?.startsWith('Bearer valid-token')) {
        req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'user' };
        (req as any).token = 'valid-token';
        return next();
      }
      if (auth?.startsWith('Bearer wrong-role')) {
        req.user = { uuid: 'user-uuid', email: 'a@b.com', role: 'admin' };
        (req as any).token = 'wrong-role';
        return next();
      }
      return next(new UnauthorizedError('Unauthorized'));
    },
  };
});

describe('POST /posts/newPost → createPostController', () => {
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

  const mockPost = {
    id: 'uuid',
    content: 'Hola mundo',
    user_id: 'user-uuid',
    file_url: null,
    file_size: null,
    media_type: 1,
    is_active: true,
    is_edited: false,
    status: 0,
    created_at: '2025-05-19T10:00:00.000Z',
    updated_at: '2025-05-19T10:00:00.000Z',
  };

  it('returns 200 + body when authenticated and valid data', async () => {
    (postCrudService.createPost as jest.Mock).mockResolvedValueOnce(mockPost);

    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body).toEqual({
      message: 'Post created successfully',
      post: mockPost,
    });
    expect(postCrudService.createPost).toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(401);

    expect(res.body).toEqual({ message: 'Unauthorized' });
  });

  it('returns 400 when validation fails', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      // No content field, so validation should fail
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array),
    });
  });

  it('returns 400 when no file is sent and mediaType is 1', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .expect(400);

    expect(res.body.message).toBe('You must send exactly one file if mediatype is 0 or 1');
  });

  it('returns 400 if file is not image/gif', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .attach('file', Buffer.from('not-image'), { filename: 'test.txt', contentType: 'text/plain' })
      .expect(400);

    expect(res.body.message).toMatch(/Error upload profile/);
  });

  it('returns 400 if file size exceeds limit', async () => {
    // Simulate multer error for file size
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 1); // 6MB
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .attach('file', bigBuffer, { filename: 'big.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toMatch(/Error upload profile/);
  });

  it('returns 400 if mediaType=2 and file is sent', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Post con gif')
      .field('mediaType', '2')
      .field('gifUrl', 'http://gif.com/anim.gif')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.gif', contentType: 'image/gif' })
      .expect(400);

    expect(res.body.message).toBe('You must not send a file when mediaType is 2');
  });

  it('returns 400 if mediaType=0 or 1 and no file is sent', async () => {
    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Post sin archivo')
      .field('mediaType', '1')
      .expect(400);

    expect(res.body.message).toBe('You must send exactly one file if mediatype is 0 or 1');
  });

  it('returns 400 if service throws BadRequestError', async () => {
    const { BadRequestError } = require('../../src/utils/errors/api-error');
    (postCrudService.createPost as jest.Mock).mockRejectedValueOnce(new BadRequestError('Custom bad request'));

    const res = await request(app)
      .post('/posts/newPost')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Hola mundo')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toBe('Custom bad request');
  });
});