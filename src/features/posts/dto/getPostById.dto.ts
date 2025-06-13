import * as yup from 'yup';

export const getPostByIdSchema = yup.object({
  commentPage: yup
    .number()
    .transform((value, original) => 
      typeof original === 'string' && original.trim() !== ''
        ? parseInt(original, 10)
        : value
    )
    .integer('The comment page must be an integer')
    .min(1, 'The comment page must be at least 1')
    .default(1),

  commentLimit: yup
    .number()
    .transform((value, original) => 
      typeof original === 'string' && original.trim() !== ''
        ? parseInt(original, 10)
        : value
    )
    .integer('The comment limit must be an integer')
    .min(1, 'The comment limit must be at least 1')
    .max(20, 'The comment limit must not exceed 20')
    .default(5),
});

export type GetPostByIdDTO = yup.InferType<typeof getPostByIdSchema>;