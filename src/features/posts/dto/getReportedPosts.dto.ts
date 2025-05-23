import * as yup from 'yup';

// Enhanced DTO Schema with Sorting and User Filtering
export const getReportedPostsSchema = yup
  .object({
    page: yup
      .number()
      .transform((value, original) =>
        typeof original === 'string' && original.trim() !== ''
          ? parseInt(original, 10)
          : value
      )
      .integer('The page must be an integer')
      .min(1, 'The page must be at least 1')
      .default(1),

    limit: yup
      .number()
      .transform((value, original) =>
        typeof original === 'string' && original.trim() !== ''
          ? parseInt(original, 10)
          : value
      )
      .integer('The limit must be an integer')
      .min(1, 'The limit must be at least 1')
      .max(20, 'The limit must not exceed 20')
      .default(10),

    orderBy: yup
      .string()
      .oneOf(['date', 'report_count'], 'Invalid sorting field')
      .default('date'),

    orderDirection: yup
      .string()
      .oneOf(['ASC', 'DESC'], 'Invalid sorting direction')
      .default('DESC'),

    username: yup
      .string()
      .optional()  // Make it optional
      .trim()
      .min(1, 'Username must not be empty')  // Avoid empty strings
  })
  .noUnknown('Only page, limit, orderBy, orderDirection, and username are allowed');

// Updated DTO Type
export type GetReportedPostsDto = yup.InferType<typeof getReportedPostsSchema>;
