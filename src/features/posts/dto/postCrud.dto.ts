import e from 'express';
import * as yup from 'yup';

export const createPostSchema = yup.object({
  content: yup
    .string()
    .required('content is required')
    .min(1, 'Content must be at least 1 character long')
    .max(300, 'Content must not exceed 300 characters'),

  mediaType: yup
    .number()
    .transform((value, originalValue) => originalValue === "" ? null : value)
    .nullable(),

  file: yup
    .mixed()
    .nullable(),

  gifUrl: yup
    .string()
    .nullable(),
}).test(
  'file-or-urlFile',
  'If mediaType is 2, urlFile is required and file must be empty. If mediaType is not 2, file is required.',
  (value) => {
    if (value.mediaType === 2) {
      return !!value.gifUrl && !value.file;
    }
    return !value.gifUrl;
  }
);

export const getFeedPostsSchema = yup.object({
  page: yup
    .number()
    .integer('The page must be an integer')
    .min(1, 'The page must be at least 1')
    .default(1),

  limit: yup
    .number()
    .integer('The limit must be an integer')
    .min(1, 'The limit must be at least 1')
    .max(5, 'The limit must not exceed 5')
    .default(5),
  date: yup
    .date()
    .typeError('date must be a valid date')
    .required('date is required'),
});

export type CreatePostsDTO = yup.InferType<typeof createPostSchema>;
export type GetFeedPostsDTO = yup.InferType<typeof getFeedPostsSchema>;