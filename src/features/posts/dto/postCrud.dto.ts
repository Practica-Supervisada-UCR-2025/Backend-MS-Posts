import * as yup from 'yup';

export const createPostSchema = yup.object({
  content: yup
    .string()
    .nullable()
    .min(1, 'Content must be at least 1 character long')
    .max(300, 'Content must not exceed 300 characters'),

  imageFile: yup
    .mixed()
    .nullable()
    .test('is-file', 'Image file must be provided', (value) => {
      // Validar que sea un archivo si está presente
      return value == null || value instanceof Buffer;
    }),

  gifFile: yup
    .mixed()
    .nullable()
    .test('is-file', 'GIF file must be provided', (value) => {
      // Validar que sea un archivo si está presente
      return value == null || value instanceof Buffer;
    }),
}).test('at-least-one', 'At least one of "content", "imageFile", or "gifFile" must be provided', (value) => {
  return value.content != null || value.imageFile != null || value.gifFile != null;
});

export type CreatePostsDTO = yup.InferType<typeof createPostSchema>;