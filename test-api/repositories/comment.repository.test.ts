import { createCommentDB } from '../../src/features/posts/repositories/comment.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockClient = (client as unknown) as { query: jest.Mock };

describe('createCommentDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería insertar un comentario y devolver el resultado', async () => {
    const fakeComment = {
      id: 'comment-uuid',
      content: 'Comentario de prueba',
      user_id: '1',
      post_id: 'post-uuid',
      file_url: null,
      file_size: 123,
      media_type: 1,
      is_active: true,
      is_edited: false,
      status: 0,
    };

    const fakeResult = {
      rows: [{ ...fakeComment, created_at: '2024-01-01', updated_at: '2024-01-01' }],
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(fakeResult);

    const result = await createCommentDB(fakeComment);

    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO comments'), [
      fakeComment.id,
      fakeComment.content,
      fakeComment.user_id,
      fakeComment.post_id,
      fakeComment.file_url,
      fakeComment.file_size,
      fakeComment.media_type,
      fakeComment.is_active,
      fakeComment.is_edited,
      fakeComment.status,
    ]);
    expect(result).toEqual({ ...fakeComment, created_at: '2024-01-01', updated_at: '2024-01-01' });
  });

  it('debería devolver undefined si no hay filas', async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [],
    } as unknown as QueryResult);

    const result = await createCommentDB({
      id: 'comment-uuid',
      content: 'Comentario de prueba',
      user_id: '1',
      post_id: 'post-uuid',
    });

    expect(result).toBeUndefined();
  });
});