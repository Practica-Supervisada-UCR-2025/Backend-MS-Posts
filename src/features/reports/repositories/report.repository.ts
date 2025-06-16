import client from '../../../config/database';
import { Report } from '../interfaces/report-entities.interface';

const ACTIVE_REPORT_STATUS = 1;

export const getReportByReporterAndPostId = async (reporter_id: string, post_id: string) => {
  const res = await client.query(
    'SELECT * FROM reports WHERE reporter_id = $1 AND reported_content_id = $2 AND status = $3',
    [reporter_id, post_id, ACTIVE_REPORT_STATUS]
  );
  return res.rows.length > 0 ? res.rows[0] : null;
};

export const createReport = async (report: Report) => {
  const result = await client.query(`
    INSERT INTO reports (id, reporter_id, reported_content_id, content_type, reason, created_at, resolver_id, status)
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
    RETURNING *`,
    [report.id, report.reporter_id, report.reported_content_id, report.content_type, report.reason, report.resolver_id || null, report.status || ACTIVE_REPORT_STATUS]
  );
  return result.rows[0];
}
