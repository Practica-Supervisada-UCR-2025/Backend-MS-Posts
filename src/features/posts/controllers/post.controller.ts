import { Response, NextFunction } from 'express';
import { deleteOwnPostService } from '../services/post.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

export const deleteOwnPostController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.uuid;
    const { postId } = req.body; 

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'Post ID is required.' });
    }

    const result = await deleteOwnPostService(userId, postId);

    return res.status(200).json({
      status: 'success',
      message: 'Post successfully deleted.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

