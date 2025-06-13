import { getCommentsByPostId, countCommentsByPostId, createCommentDB } from '../repositories/comment.repository';
import { findPostById } from '../repositories/post.repository';
import { GetPostCommentsDTO } from '../dto/commentsCrud.dto';
import { NotFoundError, InternalServerError } from '../../../utils/errors/api-error';
import { findByEmailUser } from '../repositories/post.crud.repository';
import { uploadFileToMicroservice } from './postCrud.service';
import { v4 as uuidv4 } from 'uuid';

export const getPostComments = async (
    postId: string,
    dto: GetPostCommentsDTO
) => {
    try {
        const post = await findPostById(postId);
        if (!post) {
            throw new NotFoundError('Post not found');
        }

        const comments = await getCommentsByPostId(
            postId,
            dto.startTime,
            dto.index,
            5
        );
        const totalItems = await countCommentsByPostId(postId);
        return {
            message: 'Comments fetched successfully',
            comments,
            metadata: {
                totalItems,
                currentIndex: dto.index,
            },
        };
    } catch (err) {
        if (err instanceof NotFoundError) {
            throw err;
        }
        throw new InternalServerError('Failed to fetch comments');
    }
};

export const createComment = async (
    email: string,
    tokenAuth: string,
    comment: any,
    file?: Express.Multer.File | null
) => {
    let fileUrl: string | undefined = undefined;
    let fileSize: number | undefined = undefined;

    if (comment.mediaType === 2) {
        fileUrl = comment.gifUrl;
        fileSize = undefined;
    } else if (file) {
        fileUrl = await uploadFileToMicroservice(file, tokenAuth);
        fileSize = file.size;
    }

    const user = await findByEmailUser(email);
    if (!user) {
        throw new Error('User not found');
    }

    const newCommentData: Partial<any> = {
        id: uuidv4(),
        content: comment.content,
        user_id: user.id,
        post_id: comment.postId,
        file_url: fileUrl,
        file_size: fileSize,
        media_type: comment.mediaType,
        is_active: true,
        is_edited: false,
        status: 0,
    };

    const createdComment = await createCommentDB(newCommentData);

    return {
        message: 'Comment created successfully',
        comment: createdComment,
    };
}
