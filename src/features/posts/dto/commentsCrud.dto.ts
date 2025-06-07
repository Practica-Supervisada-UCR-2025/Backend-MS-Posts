import * as yup from 'yup';

export const createCommentSchema = yup.object({
  postId: yup
    .string()
    .required('postId is required')
    .uuid('postId must be a valid UUID'),

  content: yup
    .string()
    .nullable()
    .max(300, 'Content must not exceed 300 characters'),

  mediaType: yup
    .number()
    .transform((value, originalValue) => originalValue === "" ? null : value)
    .nullable()
    .oneOf([0, 1, 2, null], 'mediaType must be 0, 1 or 2'),
  file: yup
    .mixed()
    .nullable(),

  gifUrl: yup
    .string()
    .nullable(),
})
.test(
  'gifurl-not-allowed-if-mediatype-not-2',
  'gifUrl is only allowed if mediaType is 2.',
  (value) => {
    if (value.gifUrl) {
      return value.mediaType === 2;
    }
    return true;
  }
)
.test(
  'gifurl-required-if-mediatype-2',
  'If mediaType is 2, gifUrl is required and file must be empty.',
  (value) => {
    if (value.mediaType === 2) {
      return !!value.gifUrl && !value.file;
    }
    return true;
  }
);

export const getPostCommentsSchema = yup.object({
    index: yup
        .number()
        .transform((value, original) =>
            typeof original === 'string' && original.trim() !== ''
                ? parseInt(original, 10)
                : value
        )
        .min(0, 'index must be greater or equal 0')
        .default(0),
    startTime: yup
        .date()
        .typeError('startTime must be a valid date')
        .required('startTime is required'),
});

export type GetPostCommentsDTO = yup.InferType<typeof getPostCommentsSchema>;
export type CreateCommentDTO = yup.InferType<typeof createCommentSchema>;
