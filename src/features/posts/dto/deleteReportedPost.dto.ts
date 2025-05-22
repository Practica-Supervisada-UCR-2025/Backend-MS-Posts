import * as yup from 'yup';

/**
 * @interface DeleteReportedPostDto
 * @description Interface defining the structure for deleting a reported post
 * @property {string} postId - The unique identifier of the post to be deleted
 * @property {string} authorUsername - The username of the post's author
 * @property {string} moderatorUsername - The username of the moderator performing the deletion
 */
export interface DeleteReportedPostDto {
    postId: string;
    authorUsername: string;
    moderatorUsername: string;
}

/**
 * @const deleteReportedPostSchema
 * @description Yup validation schema for the DeleteReportedPostDto
 * @type {yup.ObjectSchema}
 * 
 * Validates:
 * - postId: Required string
 * - authorUsername: Required string
 * - moderatorUsername: Required string
 * 
 * @throws {ValidationError} If any required field is missing or if unknown fields are present
 */
export const deleteReportedPostSchema = yup.object({
    postId: yup
        .string()
        .required('Post ID is required'),
    authorUsername: yup
        .string()
        .required('Author username is required'),
    moderatorUsername: yup
        .string()
        .required('Moderator username is required')
}).noUnknown('Only postId, authorUsername, and moderatorUsername are allowed'); 