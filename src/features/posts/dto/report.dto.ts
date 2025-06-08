import * as yup from 'yup';

export const createReportDto = yup.object({
  postID: yup
    .string()
    .uuid('Post ID must be a valid UUID')
    .required('post ID is required to report a post')
    .default('Contenido inapropiado'),

  reason: yup
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .nullable()
    .default('Contenido inapropiado'),
});

export type CreatePostsDTO = yup.InferType<typeof createReportDto>;