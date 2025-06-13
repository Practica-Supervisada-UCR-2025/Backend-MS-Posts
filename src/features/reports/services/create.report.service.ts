import { createReportDTO } from '../dto/report.dto';
import { createReport, getReportByReporterAndPostId } from '../repositories/report.repository';
import { v4 as uuidv4 } from 'uuid';
import { UnauthorizedError, ConflictError, InternalServerError } 
from '../../../utils/errors/api-error';

const ACTIVE_REPORT_STATUS = 1;

export const createReportService = async (reporter_id: string, report: createReportDTO) => {
  try {
    // check if the reporter has already reported this post
    const existingReport = await getReportByReporterAndPostId(reporter_id, report.postID);

    if (existingReport) {
      throw new ConflictError('You have already reported this post');
    }

    // Create report object
    const newReport = {
        id: uuidv4(),
        reporter_id: reporter_id,
        reported_content_id: report.postID,
        content_type: report.content_type,
        reason: report.reason,
        created_at: new Date(),
        resolver_id: null,
        status: ACTIVE_REPORT_STATUS
    };

    // Save report to database
    await createReport(newReport);
    return { message: 'Report created successfully.' };
  } catch (error) {
    console.error('Error in createReport service:', error);
    if (error instanceof UnauthorizedError || error instanceof ConflictError) {
      throw error;
    }
    throw new InternalServerError('Failed to create report');
  }
};