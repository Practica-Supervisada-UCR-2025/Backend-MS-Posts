import { createReportService } from '../../src/features/reports/services/create.report.service';
import * as repository from '../../src/features/reports/repositories/report.repository';
import { UnauthorizedError, ConflictError, InternalServerError } from '../../src/utils/errors/api-error';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../src/features/reports/repositories/report.repository');
jest.mock('uuid');

describe('createReportService', () => {
  const mockGetReportByReporterAndPostId = repository.getReportByReporterAndPostId as jest.Mock;
  const mockCreateReport = repository.createReport as jest.Mock;
  const mockUuidv4 = uuidv4 as jest.Mock;

  const reporterId = 'reporter-123';
  const postId = 'post-456';
  const fakeUuid = 'mock-uuid-12345';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidv4.mockReturnValue(fakeUuid);
  });

  it('should create a report successfully when no existing report is found', async () => {
    // Arrange
    mockGetReportByReporterAndPostId.mockResolvedValue(null);
    mockCreateReport.mockResolvedValue({
      id: fakeUuid,
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Inappropriate content',
      created_at: new Date(),
      resolver_id: null,
      status: 1
    });

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Inappropriate content'
    };

    // Act
    const result = await createReportService(reporterId, reportDTO);

    // Assert
    expect(mockGetReportByReporterAndPostId).toHaveBeenCalledWith(reporterId, postId);
    expect(mockCreateReport).toHaveBeenCalledWith(expect.objectContaining({
      id: fakeUuid,
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Inappropriate content',
      resolver_id: null,
      status: 1
    }));
    expect(result).toEqual({ message: 'Report created successfully.' });
  });

  it('should throw ConflictError when report already exists', async () => {
    // Arrange
    mockGetReportByReporterAndPostId.mockResolvedValue({
      id: 'existing-report-id',
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Hate speech',
      created_at: new Date(),
      resolver_id: null,
      status: 1
    });

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Inappropriate content'
    };

    // Act & Assert
    await expect(createReportService(reporterId, reportDTO))
      .rejects
      .toThrow(new ConflictError('You have already reported this post'));

    expect(mockGetReportByReporterAndPostId).toHaveBeenCalledWith(reporterId, postId);
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it('should propagate UnauthorizedError', async () => {
    // Arrange
    const unauthorizedError = new UnauthorizedError('User not authenticated');
    mockGetReportByReporterAndPostId.mockRejectedValue(unauthorizedError);

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Inappropriate content'
    };

    // Act & Assert
    await expect(createReportService(reporterId, reportDTO))
      .rejects
      .toThrow(unauthorizedError);

    expect(mockGetReportByReporterAndPostId).toHaveBeenCalledWith(reporterId, postId);
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it('should propagate ConflictError', async () => {
    // Arrange
    const conflictError = new ConflictError('Custom conflict error');
    mockGetReportByReporterAndPostId.mockRejectedValue(conflictError);

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Inappropriate content'
    };

    // Act & Assert
    await expect(createReportService(reporterId, reportDTO))
      .rejects
      .toThrow(conflictError);

    expect(mockGetReportByReporterAndPostId).toHaveBeenCalledWith(reporterId, postId);
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it('should convert other errors to InternalServerError', async () => {
    // Arrange
    const randomError = new Error('Some database error');
    mockGetReportByReporterAndPostId.mockResolvedValue(null);
    mockCreateReport.mockRejectedValue(randomError);

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Inappropriate content'
    };

    // Act & Assert
    await expect(createReportService(reporterId, reportDTO))
      .rejects
      .toThrow(new InternalServerError('Failed to create report'));

    expect(mockGetReportByReporterAndPostId).toHaveBeenCalledWith(reporterId, postId);
    expect(mockCreateReport).toHaveBeenCalled();
  });

  it('should create a report with the correct structure', async () => {
    // Arrange
    mockGetReportByReporterAndPostId.mockResolvedValue(null);
    mockCreateReport.mockResolvedValue({
      id: fakeUuid,
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Spam content',
      created_at: new Date(),
      resolver_id: null,
      status: 1
    });

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Spam content'
    };

    // Act
    await createReportService(reporterId, reportDTO);

    // Assert
    expect(mockCreateReport).toHaveBeenCalledWith({
      id: fakeUuid,
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Spam content',
      created_at: expect.any(Date),
      resolver_id: null,
      status: 1
    });
  });

  it('should use the correct ACTIVE_REPORT_STATUS value', async () => {
    // Arrange
    mockGetReportByReporterAndPostId.mockResolvedValue(null);
    mockCreateReport.mockResolvedValue({
      id: fakeUuid,
      reporter_id: reporterId,
      reported_content_id: postId,
      content_type: 'post',
      reason: 'Misleading information',
      created_at: new Date(),
      resolver_id: null,
      status: 1 // This should match the ACTIVE_REPORT_STATUS in the service
    });

    const reportDTO = {
      postID: postId,
      content_type: 'post',
      reason: 'Misleading information'
    };

    // Act
    await createReportService(reporterId, reportDTO);

    // Assert
    expect(mockCreateReport).toHaveBeenCalledWith(expect.objectContaining({
      status: 1 // Verify it uses the correct constant value
    }));
  });
});
