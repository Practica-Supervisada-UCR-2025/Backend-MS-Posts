import { createPostDB, findByEmailUser } from '../../src/features/posts/repositories/post.crud.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockClient = (client as unknown) as { query: jest.Mock };

describe('createPostDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería insertar un post y devolver el resultado', async () => {
    const fakePost = {
      id: 'uuid',
      content: 'Test post',
      user_id: '1',
      file_url: "null",
      file_size: 1,
      media_type: 1,
    };

    const fakeResult = {
      rows: [{ ...fakePost, created_at: '2024-01-01', updated_at: '2024-01-01' }],
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(fakeResult);

    const result = await createPostDB(fakePost);

    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO posts'), [
      fakePost.id,
      fakePost.content,
      fakePost.user_id,
      fakePost.file_url,
      fakePost.file_size,
      fakePost.media_type,
    ]);
    expect(result).toEqual({ ...fakePost, created_at: '2024-01-01', updated_at: '2024-01-01' });
  });

  it('debería devolver undefined si no hay filas', async () => {
    mockClient.query.mockResolvedValueOnce({
        rows: [],
    } as unknown as QueryResult);

    const result = await createPostDB({
        id: 'uuid',
        content: 'Test post',
        user_id: '1', // <-- Cambia a string
    });

    expect(result).toBeUndefined();
    });
});

describe('findByEmailUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería devolver el usuario si existe', async () => {
    const fakeUser = { id: '1', email: 'test@mail.com' };
    mockClient.query.mockResolvedValueOnce({ rows: [fakeUser] } as QueryResult);

    const result = await findByEmailUser('test@mail.com');
    expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@mail.com']);
    expect(result).toEqual(fakeUser);
  });

  it('debería devolver null si no existe el usuario', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] } as unknown as QueryResult);

    const result = await findByEmailUser('noexiste@mail.com');
    expect(result).toBeNull();
  });
});