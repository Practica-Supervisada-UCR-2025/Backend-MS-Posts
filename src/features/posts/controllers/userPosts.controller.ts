import { NextFunction, Request, Response } from 'express';
import { getUserPosts } from '../services/userPosts.service';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../../features/middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';
import { getUserPostsSchema, GetUserPostsDTO } from '../dto/getUserPosts.dto';

export const getUserPostsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Validate and cast the query parameters to GetUserPostsDTO
    const validatedQuery = await getUserPostsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    }) as GetUserPostsDTO;

    // Check if the user is authenticated
    const email = req.user.email;

    const {message, posts, metadata} = await getUserPosts(email, validatedQuery.page, validatedQuery.limit);
    res.status(200).json({
      message: message,
      posts: posts,
      metadata: metadata,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};
