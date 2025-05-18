import * as yup from 'yup';

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
    })
    .noUnknown('Only page and limit are allowed');

export type GetReportedPostsDto = yup.InferType<
    typeof getReportedPostsSchema
>;
