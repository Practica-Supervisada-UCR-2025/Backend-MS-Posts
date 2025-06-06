// src/features/posts/dto/reportPost.dto.ts
import * as yup from 'yup';

export const reportPostSchema = yup.object({
  postId: yup.string().uuid('postId must be a valid UUID').required('postId is required'),
  reason: yup.string().required('reason is required'),
  reportedBy: yup.string().uuid('reportedBy must be a valid UUID').required('reportedBy is required'),
});

export type ReportPostDTO = yup.InferType<typeof reportPostSchema>;