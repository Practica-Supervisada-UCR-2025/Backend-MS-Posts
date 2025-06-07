import { NextFunction, Response } from 'express';
import * as yup from 'yup';
import { getPostComments } from '../services/commentCrud.service';
import { getPostCommentsSchema, GetPostCommentsDTO } from '../dto/getPostComments.dto';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';

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