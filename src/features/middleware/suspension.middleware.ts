import {Response, NextFunction, Request} from 'express';
import { AuthenticatedRequest } from './authenticate.middleware';
import { isUserSuspended } from '../users/repositories/userSuspension.repository';
import { ForbiddenError } from '../../utils/errors/api-error';


export const checkUserSuspension = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user.uuid;
        const suspended = await isUserSuspended(userId);

        if (suspended) {
            throw new ForbiddenError('User account is suspended');
        }

        next();
    } catch (error) {
        next(error);
    }
};