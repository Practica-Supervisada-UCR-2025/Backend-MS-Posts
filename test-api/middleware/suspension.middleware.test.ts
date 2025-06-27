jest.mock('../../src/features/users/repositories/userSuspension.repository');

import { Request, Response, NextFunction } from 'express';
import { checkUserSuspension } from '../../src/features/middleware/suspension.middleware';
import { isUserSuspended } from '../../src/features/users/repositories/userSuspension.repository';
import { ForbiddenError } from '../../src/utils/errors/api-error';

const mockedIsUserSuspended = isUserSuspended as jest.Mock;

describe('Suspension Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            user: { uuid: 'user-uuid' },
        } as Request;
        mockResponse = {} as Response;
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('checkUserSuspension', () => {
        it('should call next() when user is not suspended', async () => {
            mockedIsUserSuspended.mockResolvedValueOnce(false);

            await checkUserSuspension(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockedIsUserSuspended).toHaveBeenCalledWith('user-uuid');
            expect(nextFunction).toHaveBeenCalledWith();
        });

        it('should pass ForbiddenError when user is suspended', async () => {
            mockedIsUserSuspended.mockResolvedValueOnce(true);

            await checkUserSuspension(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockedIsUserSuspended).toHaveBeenCalledWith('user-uuid');
            expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenError));

            // Optional: verify the error message
            const errorArg = (nextFunction as jest.Mock).mock.calls[0][0] as ForbiddenError;
            expect(errorArg.message).toBe('User is suspended');
        });

        it('should forward repository errors to next()', async () => {
            const repoError = new Error('DB failure');
            mockedIsUserSuspended.mockRejectedValueOnce(repoError);

            await checkUserSuspension(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(repoError);
        });
    });
});