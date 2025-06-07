import { Response, NextFunction } from 'express';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError } from '../../../utils/errors/api-error';
import { createCommentSchema } from '../dto/commentsCrud.dto';

export const createCommentDummyController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
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