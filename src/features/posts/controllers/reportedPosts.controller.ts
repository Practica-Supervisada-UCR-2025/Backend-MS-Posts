import { NextFunction, Response } from 'express';
import { getReportedPosts, deleteReportedPost, restoreReportedPost } from '../services/reportedPosts.service';
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


    if (req.user.role !== 'admin') {
        throw new UnauthorizedError('User with role "admin" is required to access reported posts.');
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

/**
 * @function deleteReportedPostController
 * @description Controller for deleting a reported post
 * 
 * @param {AuthenticatedRequest} req - Express request object with user authentication
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response with:
 *  - success: boolean
 *  - message: string
 * 
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {BadRequestError} If request body fails validation
 * @throws {Error} Any other error is forwarded to error-handling middleware
 */
export const deleteReportedPostController = async (
  req: AuthenticatedRequest, 
  res: Response,
  next: NextFunction
) => {
    try {
        // Validate the role first
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have permission to perform this action'
            });
        }

        // Then validate the request body
        const validatedData = await deleteReportedPostSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        }) as DeleteReportedPostDto;

        const result = await deleteReportedPost(validatedData);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error'
            });
        }
        return next(error);
    }
};

export const restoreReportedPostController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate the role first
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to perform this action'
      });
    }

    // Validate the request body
    const validatedData = await deleteReportedPostSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }) as DeleteReportedPostDto;

    const result = await restoreReportedPost(validatedData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error'
      });
    }
    return next(error);
  }
};
