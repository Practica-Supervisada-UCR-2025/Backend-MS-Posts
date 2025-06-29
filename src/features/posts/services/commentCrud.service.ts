import { getCommentsByPostId, countCommentsByPostId, createCommentDB } from '../repositories/comment.repository';
import { findPostById } from '../repositories/post.repository';
import { GetPostCommentsDTO } from '../dto/commentsCrud.dto';
import { NotFoundError, InternalServerError } from '../../../utils/errors/api-error';
import { findByEmailUser, findUserById } from '../repositories/post.crud.repository';
import { uploadFileToMicroservice } from './postCrud.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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

async function sendCommentNotification({
  userId,
  title,
  publicationId,
  commentBody,
  commentUserId,
  body,
  token
}: {
  userId: string,
  title: string,
  publicationId: string,
  commentBody: string,
  commentUserId: string,
  body: string,
  token: string
}) {
  try {
    await axios.post(
      'http://backend-notification-app:3001/api/push-notifications/send-to-user-comment',
      {
        userId,
        title,
        publicationId,
        commentBody,
        commentUserId,
        body
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    if (err instanceof Error) {
      const anyErr = err as any;
      if (anyErr.response && anyErr.response.data) {
        console.error(
          'Error sending comment notification:',
          'Status:', anyErr.response.status,
          'Data:', anyErr.response.data
        );
      } else {
        console.error('Error sending comment notification:', err.message);
      }
    } else {
      console.error('Error sending comment notification:', err);
    }
  }
}

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

    const post = await findPostById(comment.postId);
    if (!post) {
        throw new Error('Post not found');
    }
    const postOwner = await findUserById(post.user_id);
    if (!postOwner) {
        throw new Error('Post owner not found');
    }

    if (user.id === postOwner.id) {
        throw new Error('You cannot comment on your own post');
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

    await sendCommentNotification({
        userId: user.auth_id,
        title: 'New Comment on Your Post',
        publicationId: comment.postId,
        commentBody: comment.content || '',
        commentUserId: postOwner.auth_id,
        body: 'Someone commented on your post',
        token: tokenAuth
    });

    return {
        message: 'Comment created successfully',
        comment: createdComment,
    };
}
