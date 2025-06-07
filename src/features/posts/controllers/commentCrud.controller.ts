import { Response, NextFunction } from 'express';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

import {BadRequestError, UnauthorizedError} from '../../../utils/errors/api-error';
import { createCommentSchema } from '../dto/commentsCrud.dto';
import { getPostCommentsSchema, GetPostCommentsDTO } from '../dto/commentsCrud.dto';
import { getPostComments } from '../services/commentCrud.service';

export const createCommentController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {

  console.log('Body:', req.body);
  try {
    const validatedBody = await createCommentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    res.status(201).json({
      message: 'Comentario recibido correctamente',
      comment: validatedBody,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};

export const getPostCommentsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const validated = (await getPostCommentsSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        })) as GetPostCommentsDTO;

        if (!req.user) {
            throw new UnauthorizedError('User not authenticated');
        }

        const result = await getPostComments(req.params.postId, validated);
        res.status(200).json(result);
    } catch (err) {
        if (err instanceof yup.ValidationError) {
            next(new BadRequestError('Validation error', err.errors));
        } else {
            next(err);
        }
    }
};