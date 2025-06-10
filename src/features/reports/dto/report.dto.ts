import * as yup from 'yup';

export const createReportSchema = yup.object({
  postID: yup
    .string()
    .uuid('Post ID must be a valid UUID')
    .required('post ID is required to report a post'),
  reason: yup
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .default('Contenido inapropiado'),
  content_type: yup
    .string()
    .oneOf(['post'], 'Content type must be "post"')
    .optional()
    .default('post')
});

export type createReportDTO = yup.InferType<typeof createReportSchema>;