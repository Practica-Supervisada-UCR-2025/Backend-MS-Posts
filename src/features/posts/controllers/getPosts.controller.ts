import { NextFunction, Request, Response, RequestHandler } from 'express';
import { getUserPosts, getPostsByUserId, getPostById } from '../services/getPosts.service';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';
import {
  getUserPostsSchema,
  GetUserPostsDTO,
  getOtherUserPostsSchema,
  GetOtherUserPostsDTO
} from '../dto/getUserPosts.dto';

import {
  getPostByIdSchema,
  GetPostByIdDTO
} from '../dto/getPostById.dto';

/**
 * Controller to handle fetching paginated posts for the authenticated user.
 *
 * @param req - Express request object, extended with authenticated user info.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * @returns Responds with paginated posts and metadata, or passes errors to the error handler.
 * @throws BadRequestError if validation fails, UnauthorizedError if user is not authorized, or other errors from the service layer.
 */
export const getUserPostsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate and cast the query parameters to GetUserPostsDTO
    const validatedQuery = await getUserPostsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    }) as GetUserPostsDTO;

    // Check if the user is authorized
    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }

    const posts = await getUserPosts(req.user.uuid, validatedQuery.page, validatedQuery.limit);
    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};

/**
 * Controller to handle fetching paginated posts for a specific user by UUID.
 *
 * @param req - Express request object, extended with authenticated user info.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * @returns Responds with paginated posts and metadata, or passes errors to the error handler.
 * @throws BadRequestError if validation fails, UnauthorizedError if user is not authorized, or other errors from the service layer.
 */
export const getPostsByUserIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate and cast both params and query parameters
    const validatedData = await getOtherUserPostsSchema.validate(
      {
        params: req.params,
        query: req.query
      },
      {
        abortEarly: false,
        stripUnknown: true,
      }
    ) as GetOtherUserPostsDTO;

    // Check if the user is authorized
    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }

    // Extract validated data
    const { uuid } = validatedData.params;
    const { limit, time } = validatedData.query;

    // Call service function (you'll need to create or modify the appropriate service)
    const posts = await getPostsByUserId(uuid, limit, time);

    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};

export const getPostByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the user is authorized
    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }
    const postId = req.params.postId;

    // Validate the query parameters
    const validatedQuery = await getPostByIdSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    }) as GetPostByIdDTO;

    // Get the post with details
    const result = await getPostById(postId, validatedQuery);
    // const mockResponse = {
    //   message: 'Post fetched successfully',
    //   post: {
    //     id: postId,
    //     user_id: 'a8b7c6d5-e4f3-2g1h-0i9j-8k7l6m5n4o3p',
    //     content: 'Este es un post de ejemplo mockeado. El contenido puede incluir texto enriquecido, menciones a usuarios y hashtags.',
    //     file_url: 'https://picsum.photos/800/600',
    //     file_size: 1024 * 1024, // 1 MB
    //     media_type: 1, // 1 para imagen, 2 para GIF, etc.
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //     username: 'usuario_ejemplo',
    //     email: 'usuario@ejemplo.com',
    //     profile_image_url: 'https://i.pravatar.cc/150?u=usuario_ejemplo',
    //     total_comments: 12,
    //     active_reports: 2,
    //     total_reports: 3,
    //     comments: [
    //       {
    //         id: 'c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6',
    //         user_id: 'b9c8d7e6-f5g4-h3i2-j1k0-l9m8n7o6p5q4',
    //         post_id: postId,
    //         content: 'Este es un comentario de ejemplo. ¡Gran publicación!',
    //         created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    //         updated_at: new Date(Date.now() - 3600000).toISOString(),
    //         username: 'comentarista1',
    //         profile_image_url: 'https://i.pravatar.cc/150?u=comentarista1'
    //       },
    //       {
    //         id: 'd2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
    //         user_id: 'c0d9e8f7-g6h5-i4j3-k2l1-m0n9o8p7q6r5',
    //         post_id: postId,
    //         content: 'Tengo una pregunta sobre este post. ¿Puedes explicar más?',
    //         created_at: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
    //         updated_at: new Date(Date.now() - 7200000).toISOString(),
    //         username: 'comentarista2',
    //         profile_image_url: 'https://i.pravatar.cc/150?u=comentarista2'
    //       },
    //       {
    //         id: 'e3f4g5h6-i7j8-k9l0-m1n2-o3p4q5r6s7t8',
    //         user_id: 'd1e0f9g8-h7i6-j5k4-l3m2-n1o0p9q8r7s6',
    //         post_id: postId,
    //         content: 'Estoy de acuerdo con el autor. Este contenido es muy útil.',
    //         created_at: new Date(Date.now() - 10800000).toISOString(), // 3 horas atrás
    //         updated_at: new Date(Date.now() - 10800000).toISOString(),
    //         username: 'comentarista3',
    //         profile_image_url: 'https://i.pravatar.cc/150?u=comentarista3'
    //       },
    //       {
    //         id: 'f4g5h6i7-j8k9-l0m1-n2o3-p4q5r6s7t8u9',
    //         user_id: 'e2f1g0h9-i8j7-k6l5-m4n3-o2p1q0r9s8t7',
    //         post_id: postId,
    //         content: 'No estoy seguro de estar de acuerdo. ¿Alguien más tiene una opinión diferente?',
    //         created_at: new Date(Date.now() - 14400000).toISOString(), // 4 horas atrás
    //         updated_at: new Date(Date.now() - 14400000).toISOString(),
    //         username: 'comentarista4',
    //         profile_image_url: 'https://i.pravatar.cc/150?u=comentarista4'
    //       },
    //       {
    //         id: 'g5h6i7j8-k9l0-m1n2-o3p4-q5r6s7t8u9v0',
    //         user_id: 'f3g2h1i0-j9k8-l7m6-n5o4-p3q2r1s0t9u8',
    //         post_id: postId,
    //         content: 'Esto me recuerda a algo que leí hace tiempo. Muy interesante.',
    //         created_at: new Date(Date.now() - 18000000).toISOString(), // 5 horas atrás
    //         updated_at: new Date(Date.now() - 18000000).toISOString(),
    //         username: 'comentarista5',
    //         profile_image_url: 'https://i.pravatar.cc/150?u=comentarista5'
    //       }
    //     ],
    //     comments_metadata: {
    //       totalItems: 12,
    //       totalPages: 3,
    //       currentPage: 1
    //     }
    //   }
    // };
    // res.status(200).json(mockResponse);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};
