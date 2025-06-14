import { Request, Response, NextFunction } from 'express';
import { createReportService } from '../services/create.report.service';
import * as yup from 'yup';
import { createReportDTO, createReportSchema } from '../dto/report.dto';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors/api-error';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

export const createReportController = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Validate and cast the request body to RegisterDTO
    const validatedData = await createReportSchema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    }) as createReportDTO;

    // Check if the user is authorized
    if (req.user.role !== 'user') {
      throw new UnauthorizedError('Not authorized to create reports');
    }

    // Call the service to create the report
    const result = await createReportService(req.user.uuid, validatedData);
    res.status(201).json({
      message: result.message
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      next(new BadRequestError('Validation error', error.errors));
    } else {
      next(error);
    }
  }
};