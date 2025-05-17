import e, { NextFunction, Response } from 'express';
import { createPost } from '../services/postCrud.service';
import * as yup from 'yup';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError } from '../../../utils/errors/api-error';
import multer from 'multer';
import { createPostSchema, CreatePostsDTO } from '../dto/postCrud.dto';

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
}).any(); // Permite cualquier campo de archivo

export const createPostController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          reject(new BadRequestError(`Error upload profile: ${err.message}`));
        } else if (err) {
          reject(new BadRequestError(`Error upload profile: ${err.message}`));
        } else {
          resolve();
        }
      });
    });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length !== 1) {
      throw new BadRequestError('Debes enviar exactamente un archivo (imagefile o giffile)');
    }

    const file = files[0];

    // Validate and cast the request body to PostDTO
    const validatedBody = await createPostSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    }) as CreatePostsDTO;

    const token = (req as any).token;
    const email = req.user.email;

    const post = await createPost(email, token, validatedBody, file);

    res.status(200).json({
      message: 'Post created successfully',
      post: post,
    });

  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
}