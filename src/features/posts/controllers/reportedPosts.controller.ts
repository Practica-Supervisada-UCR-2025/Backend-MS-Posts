import { NextFunction, Response } from 'express';
import { getReportedPosts } from '../services/reportedPosts.service';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../../features/middleware/authenticate.middleware';
import {BadRequestError, UnauthorizedError} from '../../../utils/errors/api-error';
import { getReportedPostsSchema, GetReportedPostsDto } from '../dto/getReportedPosts.dto';

/**
 * Controller for fetching paginated reported posts.
 *
 * Validates the query string against getReportedPostsSchema,
 * calls the service, and returns:
 *  - message: string
 *  - posts: ReportedPost[]
 *  - metadata: { totalPosts, totalPages, currentPage }
 *
 * @route   GET /api/reported-posts
 * @query   page  - Page number (1-based)
 * @query   limit - Number of posts per page
 * @returns 200 with { message, posts, metadata }
 * @throws 400 if validation fails
 * @throws any other error is forwarded to the error-handling middleware
 */
export const getReportedPostsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
  try {

    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }

    const validatedQuery = (await getReportedPostsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })) as GetReportedPostsDto;

    const { page, limit } = validatedQuery;

    const { message, posts, metadata } = await getReportedPosts(page, limit);


    return res.status(200).json({
      message,
      posts,
      metadata,
    });

  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return next(new BadRequestError('Validation error', err.errors));
    }
    return next(err);
  }
};
