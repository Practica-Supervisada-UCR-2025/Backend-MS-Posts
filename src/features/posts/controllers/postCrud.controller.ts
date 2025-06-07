import e, { NextFunction, Response } from 'express';
import { createPost, getFeedPosts } from '../services/postCrud.service';
import * as yup from 'yup';
import { FeedPost } from '../interfaces/posts.entities.interface';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';
import multer from 'multer';
import { createPostSchema, CreatePostsDTO, getFeedPostsSchema, GetFeedPostsDTO } from '../dto/postCrud.dto';

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

    const files = req.files as Express.Multer.File[] | undefined;
    const file = files && files.length > 0 ? files[0] : undefined;

    const validatedBody = await createPostSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    }) as CreatePostsDTO;

    if ((validatedBody.mediaType === 0 || validatedBody.mediaType === 1) && !file) {
      throw new BadRequestError('You must send exactly one file if mediatype is 0 or 1');
    }

    if (!(validatedBody.mediaType === 0 || validatedBody.mediaType === 1) && file) {
      throw new BadRequestError('Mediatype must be 0 or 1 if file is present');
    }

    if (validatedBody.mediaType === 2 && file) {
      throw new BadRequestError('You must not send a file when mediaType is 2');
    }

    const token = (req as any).token;
    const email = req.user.email;

    const post = await createPost(email, token, validatedBody, file);

    res.status(201).json({
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

export const getPostsFeedController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = await getFeedPostsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    }) as GetFeedPostsDTO;

    if (req.user.role !== 'user') {
      throw new UnauthorizedError('User not authenticated');
    }

    const postsFeed = await getFeedPosts(validatedData.date, validatedData.limit); 

    res.status(200).json({
      message: 'Posts feed retrieved successfully',
      posts: postsFeed,
    });
  } catch (error) {
    next(error);
  }
}