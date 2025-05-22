import { deleteReportedPostSchema } from '../../src/features/posts/dto/deleteReportedPost.dto';

describe('deleteReportedPostSchema', () => {
  it('should validate and transform valid input', async () => {
    const input = {
      postId: '123',
      authorUsername: 'author123',
      moderatorUsername: 'moderator123'
    };

    const result = await deleteReportedPostSchema.validate(input);

    expect(result).toEqual({
      postId: '123',
      authorUsername: 'author123',
      moderatorUsername: 'moderator123'
    });
  });

  it('should throw an error when postId is missing', async () => {
    const input = {
      authorUsername: 'author123',
      moderatorUsername: 'moderator123'
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El ID del post es requerido'
    );
  });

  it('should throw an error when authorUsername is missing', async () => {
    const input = {
      postId: '123',
      moderatorUsername: 'moderator123'
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El nombre del autor es requerido'
    );
  });

  it('should throw an error when moderatorUsername is missing', async () => {
    const input = {
      postId: '123',
      authorUsername: 'author123'
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El nombre del moderador es requerido'
    );
  });

  it('should throw an error when postId is empty', async () => {
    const input = {
      postId: '',
      authorUsername: 'author123',
      moderatorUsername: 'moderator123'
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El ID del post es requerido'
    );
  });

  it('should throw an error when authorUsername is empty', async () => {
    const input = {
      postId: '123',
      authorUsername: '',
      moderatorUsername: 'moderator123'
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El nombre del autor es requerido'
    );
  });

  it('should throw an error when moderatorUsername is empty', async () => {
    const input = {
      postId: '123',
      authorUsername: 'author123',
      moderatorUsername: ''
    };

    await expect(deleteReportedPostSchema.validate(input)).rejects.toThrow(
      'El nombre del moderador es requerido'
    );
  });

  it('should strip unknown fields', async () => {
    const input = {
      postId: '123',
      authorUsername: 'author123',
      moderatorUsername: 'moderator123',
      unknownField: 'value'
    };

    const result = await deleteReportedPostSchema.validate(input);

    expect(result).toEqual({
      postId: '123',
      authorUsername: 'author123',
      moderatorUsername: 'moderator123'
    });
  });
}); 