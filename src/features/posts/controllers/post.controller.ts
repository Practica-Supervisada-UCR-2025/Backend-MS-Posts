import { Response, NextFunction } from 'express';
import { deleteOwnPostService } from '../services/post.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

export const deleteOwnPostController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.uuid;
  const { postId } = req.params;

  if (!postId) {
    return res.status(400).json({ status: 'error', message: 'Post ID is required.' });
  }

  const result = await deleteOwnPostService(userId, postId);

  if (!result.success) {
    return res.status(result.status || 500).json({
      status: 'error',
      message: result.message,
    });
  }

  return res.status(200).json({
    status: 'success',
    message: 'Post successfully deleted.',
    data: result.data,
  });
};