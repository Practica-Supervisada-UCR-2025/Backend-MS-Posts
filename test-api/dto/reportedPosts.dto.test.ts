// Import necessary modules
import { getReportedPostsSchema } from '../../src/features/posts/dto/getReportedPosts.dto';

describe('getReportedPostsSchema', () => {
  it('should validate and transform valid input', async () => {
    const input = {
      page: '2',
      limit: '5',
      orderBy: 'report_count',
      orderDirection: 'ASC',
      username: 'testuser',
    };

    const result = await getReportedPostsSchema.validate(input);

    expect(result).toEqual({
      page: 2,
      limit: 5,
      orderBy: 'report_count',
      orderDirection: 'ASC',
      username: 'testuser',
    });
  });

  it('should apply default values for missing fields', async () => {
    const input = {};

    const result = await getReportedPostsSchema.validate(input);

    expect(result).toEqual({
      page: 1,
      limit: 10,
      orderBy: 'date',
      orderDirection: 'DESC',
      username: undefined,
    });
  });

  it('should throw an error for invalid page value', async () => {
    const input = { page: '0' };

    await expect(getReportedPostsSchema.validate(input)).rejects.toThrow(
      'The page must be at least 1'
    );
  });

  it('should throw an error for invalid limit value', async () => {
    const input = { limit: '25' };

    await expect(getReportedPostsSchema.validate(input)).rejects.toThrow(
      'The limit must not exceed 20'
    );
  });

  it('should throw an error for invalid orderBy value', async () => {
    const input = { orderBy: 'invalid_field' };

    await expect(getReportedPostsSchema.validate(input)).rejects.toThrow(
      'Invalid sorting field'
    );
  });

  it('should throw an error for invalid orderDirection value', async () => {
    const input = { orderDirection: 'UP' };

    await expect(getReportedPostsSchema.validate(input)).rejects.toThrow(
      'Invalid sorting direction'
    );
  });

  it('should throw an error for empty username', async () => {
    const input = { username: '' };

    await expect(getReportedPostsSchema.validate(input)).rejects.toThrow(
      'Username must not be empty'
    );
  });

  it('should strip unknown fields', async () => {
    const input = { unknownField: 'value' };

    await expect(
      getReportedPostsSchema.strict().validate(input)
    ).rejects.toThrow(
      'Only page, limit, orderBy, orderDirection, and username are allowed'
    );
  });

  it('should handle string transformations for page and limit', async () => {
    const input = { page: '3', limit: '15' };

    const result = await getReportedPostsSchema.validate(input);

    expect(result).toEqual({
      page: 3,
      limit: 15,
      orderBy: 'date',
      orderDirection: 'DESC',
      username: undefined,
    });
  });

  it('should handle optional username field', async () => {
    const input = { username: 'validUser' };

    const result = await getReportedPostsSchema.validate(input);

    expect(result).toEqual({
      page: 1,
      limit: 10,
      orderBy: 'date',
      orderDirection: 'DESC',
      username: 'validUser',
    });
  });
});
