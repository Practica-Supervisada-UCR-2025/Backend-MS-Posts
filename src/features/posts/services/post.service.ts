import { deleteOwnPostRepository, findPostById } from "../repositories/post.repository";

export const deleteOwnPostService = async (userId: string, postId: string) => {
  const post = await findPostById(postId);

  if (!post) {
    return {
      success: false,
      status: 404,
      message: 'Post not found.'
    };
  }

  if (post.user_id !== userId) {
    return {
      success: false,
      status: 403,
      message: 'You are not authorized to delete this post.'
    };
  }

  if (!post.is_active) {
    return {
      success: false,
      status: 400,
      message: 'This post is already deleted.'
    };
  }

  await deleteOwnPostRepository(postId);

  return {
    success: true,
    data: { postId, deleted: true }
  };
};
