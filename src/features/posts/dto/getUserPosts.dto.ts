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

export const getOtherUserPostsSchema = yup.object({
  params: yup.object({
    uuid: yup.string()
      .uuid('The user ID must be a valid UUID')
      .required('User UUID is required'),
  }),
  query: yup.object({
    limit: yup
      .number()
      .integer('The limit must be an integer')
      .min(1, 'The limit must be at least 1')
      .max(20, 'The limit must not exceed 20')
      .default(10),
    
    time: yup
      .string()
      .test(
        'is-date',
        'Time must be a valid ISO date string',
        (value) => !value || !isNaN(Date.parse(value))
      )
      .required('Time is required')
  }),
});

export type GetUserPostsDTO = yup.InferType<typeof getUserPostsSchema>;
export type GetOtherUserPostsDTO = yup.InferType<typeof getOtherUserPostsSchema>;
