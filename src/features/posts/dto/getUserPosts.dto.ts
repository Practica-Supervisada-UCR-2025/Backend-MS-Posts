import * as yup from 'yup';

export const getUserPostsSchema = yup.object({
  page: yup
    .number()
    .integer('The page must be an integer')
    .min(1, 'The page must be at least 1')
    .default(1),

  limit: yup
    .number()
    .integer('The limit must be an integer')
    .min(1, 'The limit must be at least 1')
    .max(20, 'The limit must not exceed 20')
    .default(10),
});

export type GetUserPostsDTO = yup.InferType<typeof getUserPostsSchema>;
