import request from 'supertest';
import express from 'express';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';
import { createReportController } from '../../src/features/reports/controllers/create.report.controller';
import reportRoutes from '../../src/features/reports/routes/reports.routes';

const app = express();
app.use(express.json());
app.use(reportRoutes);

jest.mock('../../src/features/middleware/authenticate.middleware');
jest.mock('../../src/features/reports/controllers/create.report.controller');

describe('POST /posts/report', () => {
  const mockedAuthenticateJWT = jest.mocked(authenticateJWT);
  const mockedCreateReportController = jest.mocked(createReportController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and success message when authenticated as user', async () => {
    const mockUserData = { uuid: 'user-uuid', email: 'user@example.com', role: 'user' };
    
    mockedAuthenticateJWT.mockImplementation((req, res, next) => {
      req.user = mockUserData;
      next();
    });
    
    mockedCreateReportController.mockImplementation((req, res) => {
      res.status(201).json({
        message: 'Report created successfully.'
      });
    });

    const validReportData = {
      postID: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Inappropriate content',
      content_type: 'post'
    };

    const response = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(validReportData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Report created successfully.'
    });
    expect(mockedCreateReportController).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    mockedAuthenticateJWT.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Unauthorized' });
    });

    const validReportData = {
      postID: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Inappropriate content',
      content_type: 'post'
    };

    const response = await request(app)
      .post('/posts/report')
      .send(validReportData);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    expect(mockedCreateReportController).not.toHaveBeenCalled();
  });

  it('should return 401 when authenticated as admin', async () => {
    const mockAdminData = { uuid: 'admin-uuid', email: 'admin@example.com', role: 'admin' };
    
    mockedAuthenticateJWT.mockImplementation((req, res, next) => {
      req.user = mockAdminData;
      next();
    });
    
    mockedCreateReportController.mockImplementation((req, res) => {
      res.status(401).json({ message: 'Not authorized to create reports' });
    });

    const validReportData = {
      postID: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Inappropriate content',
      content_type: 'post'
    };

    const response = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer admin-token')
      .send(validReportData);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Not authorized to create reports' });
  });

  it('should return 400 when validation fails', async () => {
    const mockUserData = { uuid: 'user-uuid', email: 'user@example.com', role: 'user' };
    
    mockedAuthenticateJWT.mockImplementation((req, res, next) => {
      req.user = mockUserData;
      next();
    });
    
    mockedCreateReportController.mockImplementation((req, res) => {
      res.status(400).json({ 
        message: 'Validation error',
        details: ['Post ID is required to report a post']
      });
    });

    // Missing postID
    const invalidReportData = {
      reason: 'Inappropriate content',
      content_type: 'post'
    };

    const response = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(invalidReportData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      details: expect.any(Array)
    });
    expect(response.body.details).toContainEqual(expect.stringMatching(/Post ID is required/));
  });

  it('should return 409 when report already exists', async () => {
    const mockUserData = { uuid: 'user-uuid', email: 'user@example.com', role: 'user' };
    
    mockedAuthenticateJWT.mockImplementation((req, res, next) => {
      req.user = mockUserData;
      next();
    });
    
    mockedCreateReportController.mockImplementation((req, res) => {
      res.status(409).json({ message: 'You have already reported this post' });
    });

    const validReportData = {
      postID: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Inappropriate content',
      content_type: 'post'
    };

    const response = await request(app)
      .post('/posts/report')
      .set('Authorization', 'Bearer valid-token')
      .send(validReportData);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'You have already reported this post' });
  });
});
