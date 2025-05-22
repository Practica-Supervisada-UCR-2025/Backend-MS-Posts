import * as yup from 'yup';

export interface DeleteReportedPostDto {
    postId: string;
    authorUsername: string;
    moderatorUsername: string;
}

export const deleteReportedPostSchema = yup.object({
    postId: yup
        .string()
        .required('El ID del post es requerido'),
    authorUsername: yup
        .string()
        .required('El nombre del autor es requerido'),
    moderatorUsername: yup
        .string()
        .required('El nombre del moderador es requerido')
}).noUnknown('Only postId, authorUsername, and moderatorUsername are allowed'); 