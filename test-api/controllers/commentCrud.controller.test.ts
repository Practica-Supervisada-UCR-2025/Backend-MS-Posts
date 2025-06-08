import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import multer from 'multer';
import * as commentService from '../../src/features/posts/services/commentCrud.service';
import commentsRoutes from '../../src/features/posts/routes/comment.routes';
import { getCommentsByPostId, countCommentsByPostId } from '../../src/features/posts/repositories/comment.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
}));

jest.mock('../../src/features/posts/services/commentCrud.service');

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
      return next(new UnauthorizedError('Unauthorized'));
    },
  };
});

const mockClient = client as unknown as { query: jest.Mock };

describe('Comment Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCommentsByPostId', () => {
        it('should return comments for given post', async () => {
            const rows = [
                { id: '1', content: 'hi', username: 'alice', created_at: new Date() },
            ];
            mockClient.query.mockResolvedValueOnce({
                rows,
                rowCount: rows.length,
                command: '',
                oid: 0,
                fields: [],
            } as QueryResult);

            const result = await getCommentsByPostId('p1', new Date('2024-01-01'), 0, 5);

            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('FROM comments'), ['p1', new Date('2024-01-01'), 5, 0]);
            expect(result).toEqual(rows);
        });

        it('applies pagination offset correctly', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: [],
            } as QueryResult);

            await getCommentsByPostId('p1', new Date('2024-01-01'), 1, 5);

            expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['p1', new Date('2024-01-01'), 5, 5]);
        });
    });

    describe('countCommentsByPostId', () => {
        it('should return comment count', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [{ count: '3' }] } as QueryResult);

            const count = await countCommentsByPostId('p1');

            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) FROM comments'), ['p1']);
            expect(count).toBe(3);
        });
    });
});

describe('CreateCommentController', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', commentsRoutes);
    app.use(errorHandler as ErrorRequestHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockComment = {
    id: 'comment-uuid',
    content: 'Buen comentario',
    user_id: 'user-uuid',
    post_id: 'post-uuid',
    file_url: null,
    file_size: null,
    media_type: 1,
    is_active: true,
    created_at: '2025-06-08T10:00:00.000Z',
    updated_at: '2025-06-08T10:00:00.000Z',
  };

  it('returns 201 + body when authenticated and valid data', async () => {
    (commentService.createComment as jest.Mock).mockResolvedValueOnce(mockComment);

    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('content', 'Buen comentario')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(201);

    expect(res.body).toEqual({
      message: 'Comentario recibido correctamente',
      comment: mockComment,
    });
    expect(commentService.createComment).toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .field('content', 'Buen comentario')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(401);

    expect(res.body).toEqual({ message: 'Unauthorized' });
  });

  it('returns 400 when validation fails', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('mediaType', '1')
      .expect(400);

    expect(res.body).toEqual({
      message: 'postId is required',
    });
  });

  it('returns 400 when no file is sent and mediaType is 1', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('content', 'Buen comentario')
      .field('mediaType', '1')
      .expect(400);

    expect(res.body.message).toBe('If mediaType is 0 or 1, file is required.');
  });

  it('returns 400 if file is present and mediaType is not 0 or 1', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('content', 'Comentario con archivo')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toBe('If file is present, mediaType must be 0 or 1.');
  });

  it('returns 400 if mediatype is 2 and gifUrl is not present', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('content', 'Comentario con archivo')
      .field('mediaType', '2')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toBe('If mediaType is 2, gifUrl is required and file must be empty.');
  });

  it('returns 400 if neither content nor file is sent', async () => {
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('mediaType', '1')
      .expect(400);

    expect(res.body.message).toBe('At least one of content or file is required.');
  });

  it('returns 400 if multer throws error', async () => {
    // Simulate multer error by sending a too large file
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 1); // 6MB
    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('content', 'Comentario grande')
      .field('mediaType', '1')
      .attach('file', bigBuffer, { filename: 'big.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toMatch(/Error creating comment/);
  });

  it('returns 400 if service throws BadRequestError', async () => {
    const { BadRequestError } = require('../../src/utils/errors/api-error');
    (commentService.createComment as jest.Mock).mockRejectedValueOnce(new BadRequestError('Custom bad request'));

    const res = await request(app)
      .post('/posts/newComment')
      .set('Authorization', 'Bearer valid-token')
      .field('postId', '123e4567-e89b-12d3-a456-426614174000')
      .field('content', 'Buen comentario')
      .field('mediaType', '1')
      .attach('file', Buffer.from('fake-image'), { filename: 'test.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toBe('Custom bad request');
  });
});