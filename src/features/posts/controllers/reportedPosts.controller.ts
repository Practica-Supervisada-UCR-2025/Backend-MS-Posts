import { NextFunction, Response } from 'express';
import { getReportedPosts, deleteReportedPost } from '../services/reportedPosts.service';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../../features/middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';
import { getReportedPostsSchema, GetReportedPostsDto } from '../dto/getReportedPosts.dto';
import { DeleteReportedPostDto, deleteReportedPostSchema } from '../dto/deleteReportedPost.dto';


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
 * @query   orderBy - Field to sort by (date, report_count, username)
 * @query   orderDirection - Sorting direction (ASC, DESC)
 * @query   username - (Optional) Filter by username
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
    // Ensure user is authenticated
    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }

    // Validate and parse query parameters
    const validatedQuery = (await getReportedPostsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })) as GetReportedPostsDto;

    const { page, limit, orderBy, orderDirection, username } = validatedQuery;

    // Fetch reported posts with sorting and filtering
    const { message, posts, metadata } = await getReportedPosts(
      page,
      limit,
      orderBy,
      orderDirection,
      username
    );

    // Return response
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

export const deleteReportedPostController = async (
  req: AuthenticatedRequest, 
  res: Response,
  next: NextFunction
) => {
    try {
        const validatedData = await deleteReportedPostSchema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        }) as DeleteReportedPostDto;

        // Validate the role
        const role = req.user.role;
        if (role != 'admin'){
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have permission to perform this action'
            });
        }

        const result = await deleteReportedPost(validatedData);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'An unexpected error occurred'
            });
        }
    }
};