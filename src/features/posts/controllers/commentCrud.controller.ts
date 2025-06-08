import { Response, NextFunction } from 'express';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

import {BadRequestError, UnauthorizedError} from '../../../utils/errors/api-error';
import { createCommentSchema } from '../dto/commentsCrud.dto';
import { getPostCommentsSchema, GetPostCommentsDTO } from '../dto/commentsCrud.dto';
import { getPostComments, createComment } from '../services/commentCrud.service';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'image/gif'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error('Solo se permiten archivos de imagen o GIF'));
    }
  }
}).any();

export const createCommentController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          reject(new BadRequestError(`Error creating comment: ${err.message}`));
        } else if (err) {
          reject(new BadRequestError(`Error creating comment: ${err.message}`));
        } else {
          resolve();
        }
      });
    });

    const validatedBody = await createCommentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const files = req.files as Express.Multer.File[] | undefined;
    const file = files && files.length > 0 ? files[0] : undefined;

    if ((!validatedBody.content || validatedBody.content.length === 0) && !file) {
      throw new BadRequestError('At least one of content or file is required.');
    }

    if ((validatedBody.mediaType === 0 || validatedBody.mediaType === 1) && !file) {
      throw new BadRequestError('If mediaType is 0 or 1, file is required.');
    }

    if (file && !(validatedBody.mediaType === 0 || validatedBody.mediaType === 1)) {
      throw new BadRequestError('If file is present, mediaType must be 0 or 1.');
    }

    if (req.file && !(validatedBody.mediaType === 0 || validatedBody.mediaType === 1)) {
      throw new BadRequestError('If file is present, mediaType must be 0 or 1.');
    }

    const token = (req as any).token;
    const email = req.user.email;

    const createdComment =  await createComment(email, token, validatedBody, file)

    res.status(201).json({
      message: 'Comentario recibido correctamente',
      comment: createdComment,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError(error.errors.join(', ')));
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