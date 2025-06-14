import { getReportByReporterAndPostId, createReport } from '../../src/features/reports/repositories/report.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';
import { Report } from '../../src/features/reports/interfaces/report-entities.interface';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockClient = (client as unknown) as { query: jest.Mock };

describe('getReportByReporterAndPostId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a report when one exists', async () => {
    // Arrange
    const fakeReport = {
      id: 'report-uuid',
      reporter_id: 'user-123',
      reported_content_id: 'post-456',
      content_type: 'post',
      reason: 'Inappropriate content',
      created_at: new Date().toISOString(),
      resolver_id: null,
      status: 1
    };

    const mockQueryResult = {
      rows: [fakeReport]
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(mockQueryResult);

    // Act
    const result = await getReportByReporterAndPostId('user-123', 'post-456');

    // Assert
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT * FROM reports WHERE reporter_id = $1 AND reported_content_id = $2 AND status = $3',
      ['user-123', 'post-456', 1]
    );
    expect(result).toEqual(fakeReport);
  });

  it('should return null when no report exists', async () => {
    // Arrange
    const mockQueryResult = {
      rows: []
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(mockQueryResult);

    // Act
    const result = await getReportByReporterAndPostId('user-123', 'post-456');

    // Assert
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT * FROM reports WHERE reporter_id = $1 AND reported_content_id = $2 AND status = $3',
      ['user-123', 'post-456', 1]
    );
    expect(result).toBeNull();
  });
});

describe('createReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a report and return the result', async () => {
    // Arrange
    const fakeReport: Report = {
      id: 'report-uuid',
      reporter_id: 'user-123',
      reported_content_id: 'post-456',
      content_type: 'post',
      reason: 'Inappropriate content',
      created_at: new Date(),
      resolver_id: null,
      status: 1
    };

    const mockQueryResult = {
      rows: [{
        ...fakeReport,
        created_at: new Date().toISOString()
      }]
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(mockQueryResult);

    // Act
    const result = await createReport(fakeReport);

    // Assert
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reports'),
      [
        fakeReport.id,
        fakeReport.reporter_id,
        fakeReport.reported_content_id,
        fakeReport.content_type,
        fakeReport.reason,
        fakeReport.resolver_id,
        fakeReport.status
      ]
    );
    expect(result).toEqual(expect.objectContaining({
      id: fakeReport.id,
      reporter_id: fakeReport.reporter_id,
      reported_content_id: fakeReport.reported_content_id,
      content_type: fakeReport.content_type,
      reason: fakeReport.reason
    }));
  });

  it('should use default status value when not provided', async () => {
    // Arrange
    const fakeReport: Report = {
      id: 'report-uuid',
      reporter_id: 'user-123',
      reported_content_id: 'post-456',
      content_type: 'post',
      reason: 'Inappropriate content',
      resolver_id: null
    };

    const mockQueryResult = {
      rows: [{
        ...fakeReport,
        status: 1,
        created_at: new Date().toISOString()
      }]
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(mockQueryResult);

    // Act
    const result = await createReport(fakeReport);

    // Assert
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reports'),
      [
        fakeReport.id,
        fakeReport.reporter_id,
        fakeReport.reported_content_id,
        fakeReport.content_type,
        fakeReport.reason,
        fakeReport.resolver_id,
        1 // Default active report status
      ]
    );
    expect(result.status).toBe(1);
  });

  it('should handle reports with specified resolver_id and status', async () => {
    // Arrange
    const fakeReport: Report = {
      id: 'report-uuid',
      reporter_id: 'user-123',
      reported_content_id: 'post-456',
      content_type: 'post',
      reason: 'Inappropriate content',
      resolver_id: 'admin-789',
      status: 2 // Assuming 2 might be "resolved" status
    };

    const mockQueryResult = {
      rows: [{
        ...fakeReport,
        created_at: new Date().toISOString()
      }]
    } as QueryResult;

    mockClient.query.mockResolvedValueOnce(mockQueryResult);

    // Act
    const result = await createReport(fakeReport);

    // Assert
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reports'),
      [
        fakeReport.id,
        fakeReport.reporter_id,
        fakeReport.reported_content_id,
        fakeReport.content_type,
        fakeReport.reason,
        fakeReport.resolver_id,
        fakeReport.status
      ]
    );
    expect(result.resolver_id).toBe('admin-789');
    expect(result.status).toBe(2);
  });
});
