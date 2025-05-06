// src/middlewares/authenticate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../posts/services/jwt.service';
import { UnauthorizedError } from '../../utils/errors/api-error';

export interface AuthenticatedRequest extends Request {
  user: {
    role: string;
  };
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] === '') {
      throw new UnauthorizedError('Invalid token format');
    }

    const token = authHeader.split('Bearer ')[1];

    const jwtService = new JwtService();
    const decoded = jwtService.verifyToken(token);

    // Validate and set role to either 'user' or 'admin'
    const validRole = decoded.role === 'admin' ? 'admin' : 'user';
    
    // Convertimos el req a AuthenticatedRequest al inyectar la propiedad user
    (req as AuthenticatedRequest).user = {
      role: validRole
    };

    next();
  } catch (error) {
    next(error);
  }
};
