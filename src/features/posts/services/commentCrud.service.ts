import { getCommentsByPostId, countCommentsByPostId } from '../repositories/comment.repository';
import { findPostById } from '../repositories/post.repository';
import { GetPostCommentsDTO } from '../dto/commentsCrud.dto';
import { NotFoundError, InternalServerError } from '../../../utils/errors/api-error';

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