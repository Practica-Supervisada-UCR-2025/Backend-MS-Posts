import { getPostByIdSchema } from '../../src/features/posts/dto/getPostById.dto';

describe('getPostByIdSchema', () => {
  it('should validate and transform valid inputs', async () => {
    const validInput = {
      commentPage: '2',
      commentLimit: '10'
    };

    const result = await getPostByIdSchema.validate(validInput);

    expect(result).toEqual({
      commentPage: 2,
      commentLimit: 10
    });
  });

  it('should use default values when no input is provided', async () => {
    const result = await getPostByIdSchema.validate({});

    expect(result).toEqual({
      commentPage: 1,
      commentLimit: 5
    });
  });

  it('should reject commentPage less than 1', async () => {
    const invalidInput = {
      commentPage: 0,
      commentLimit: 5
    };

    await expect(getPostByIdSchema.validate(invalidInput))
      .rejects.toThrow('The comment page must be at least 1');
  });

  it('should reject commentLimit less than 1', async () => {
    const invalidInput = {
      commentPage: 1,
      commentLimit: 0
    };

    await expect(getPostByIdSchema.validate(invalidInput))
      .rejects.toThrow('The comment limit must be at least 1');
  });

  it('should reject commentLimit greater than 20', async () => {
    const invalidInput = {
      commentPage: 1,
      commentLimit: 25
    };

    await expect(getPostByIdSchema.validate(invalidInput))
      .rejects.toThrow('The comment limit must not exceed 20');
  });

  it('should transform string numbers to integers', async () => {
    const input = {
      commentPage: '3',
      commentLimit: '15'
    };

    const result = await getPostByIdSchema.validate(input);

    expect(result).toEqual({
      commentPage: 3,
      commentLimit: 15
    });
  });

  it('should reject non-numeric strings', async () => {
    const invalidInput = {
      commentPage: 'abc',
      commentLimit: '5'
    };

    await expect(getPostByIdSchema.validate(invalidInput))
      .rejects.toThrow();
  });
});