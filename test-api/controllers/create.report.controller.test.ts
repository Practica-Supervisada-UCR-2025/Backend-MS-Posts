import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import reportRoutes from '../../src/features/reports/routes/reports.routes';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import * as createReportService from '../../src/features/reports/services/create.report.service';
import { Report } from '../../src/features/reports/interfaces/report-entities.interface';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../src/features/reports/services/create.report.service');
jest.mock('uuid');

// Define mock routes since we may not have access to the actual routes file
const mockReportRoutes = express.Router();
import { createReportController } from '../../src/features/reports/controllers/create.report.controller';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
mockReportRoutes.post('/posts/report', authenticateJWT, createReportController);

jest.mock('../../src/features/middleware/authenticate.middleware', () => {
  const { UnauthorizedError } = require('../../src/utils/errors/api-error');
  return {
    authenticateJWT: (req: any, res: any, next: any) => {
      const auth = req.headers.authorization as string;
      if (auth?.startsWith('Bearer valid-token')) {
        req.user = { uuid: 'user-uuid', email: 'test@example.com', role: 'user' };
        (req as any).token = 'valid-token';
        return next();
      }
      if (auth?.startsWith('Bearer admin-token')) {
        req.user = { uuid: 'admin-uuid', email: 'admin@example.com', role: 'admin' };
        (req as any).token = 'admin-token';
        return next();
      }
      return next(new UnauthorizedError('Unauthorized'));
    },
  };
});

describe('POST /posts/report → createReportController', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', mockReportRoutes);
    app.use(errorHandler as ErrorRequestHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('mock-report-uuid');
  });

  const validReportData = {
    postID: '123e4567-e89b-12d3-a456-426614174000',
    reason: 'Inappropriate content',
    content_type: 'post'
  };
  it('returns 201 when report is created successfully', async () => {
    // Mock the service to return a successful result
    (createReportService.createReportService as jest.Mock).mockResolvedValueOnce({
      message: 'Report created successfully.'
    });

    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(validReportData)
      .expect(201);

    expect(res.body).toEqual({
      message: 'Report created successfully.'
    });
    expect(createReportService.createReportService).toHaveBeenCalledWith(
      'user-uuid', 
      expect.objectContaining(validReportData)
    );
  });
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/posts/report')
      .send(validReportData)
      .expect(401);

    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('returns 401 when user role is not "user"', async () => {
    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer admin-token')
      .send(validReportData)
      .expect(401);

    expect(res.body).toEqual({ message: 'Not authorized to create reports' });
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('returns 400 when validation fails due to missing postID', async () => {
    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send({
        reason: 'Inappropriate content',
        content_type: 'post'
      })
      .expect(400);

    expect(res.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array)
    });
    expect(res.body.details).toContainEqual(expect.stringMatching(/post ID is required/));
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('returns 400 when validation fails due to invalid postID format', async () => {
    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send({
        postID: 'not-a-valid-uuid',
        reason: 'Inappropriate content',
        content_type: 'post'
      })
      .expect(400);

    expect(res.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array)
    });
    expect(res.body.details).toContainEqual(expect.stringMatching(/valid UUID/));
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('returns 400 when validation fails due to invalid content_type', async () => {
    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send({
        postID: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Inappropriate content',
        content_type: 'comment' // Only 'post' is valid
      })
      .expect(400);

    expect(res.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array)
    });
    expect(res.body.details).toContainEqual(expect.stringMatching(/Content type must be "post"/));
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('returns 400 when validation fails due to reason too long', async () => {
    const longReason = 'a'.repeat(256); // Exceeds 255 character limit
    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send({
        postID: '123e4567-e89b-12d3-a456-426614174000',
        reason: longReason,
        content_type: 'post'
      })
      .expect(400);

    expect(res.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array)
    });
    expect(res.body.details).toContainEqual(expect.stringMatching(/must not exceed 255 characters/));
    expect(createReportService.createReportService).not.toHaveBeenCalled();
  });
  it('uses default values when optional fields are not provided', async () => {
    (createReportService.createReportService as jest.Mock).mockResolvedValueOnce({
      message: 'Report created successfully.'
    });

    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send({
        postID: '123e4567-e89b-12d3-a456-426614174000'
        // reason and content_type are optional with defaults
      })
      .expect(201);

    expect(res.body).toEqual({
      message: 'Report created successfully.'
    });
    expect(createReportService.createReportService).toHaveBeenCalledWith(
      'user-uuid', 
      expect.objectContaining({
        postID: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Contenido inapropiado', // Default value
        content_type: 'post' // Default value
      })
    );
  });
  it('returns 500 when service throws unexpected error', async () => {
    (createReportService.createReportService as jest.Mock).mockRejectedValueOnce(
      new Error('Unexpected error')
    );

    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(validReportData)
      .expect(500);

    expect(res.body).toEqual({
      message: 'Internal Server Error'
    });
  });
  it('returns specific error status when service throws API error', async () => {
    const { ConflictError } = require('../../src/utils/errors/api-error');
    (createReportService.createReportService as jest.Mock).mockRejectedValueOnce(
      new ConflictError('You have already reported this post')
    );

    const res = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(validReportData)
      .expect(409); // Conflict status code

    expect(res.body).toEqual({
      message: 'You have already reported this post'
    });
  });
});
