import { deleteOwnPostRepository, findPostById } from "../repositories/post.repository";

export const deleteOwnPostService = async (userId: string, postId: string) => {
    // Check if the post exists and is owned by the user
    const post = await findPostById(postId);

    if (!post) {
        throw { status: 404, message: 'Post not found.' };
    }

    if (post.user_id !== userId) {
        throw { status: 403, message: 'You are not authorized to delete this post.' };
    }

    if (!post.is_active) {
        throw { status: 400, message: 'This post is already deleted.' };
    }

    // Soft delete the post
    await deleteOwnPostRepository(postId);

    return { postId, deleted: true };
};
