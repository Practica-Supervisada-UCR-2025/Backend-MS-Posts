export interface BaseReport {
  id: string;
  reporter_id: string;
  reporter_content_id: string;
  content_type?: string;
  reason?: string;
  created_at?: Date;
  resulver_id?: string | null;
  status?: number;
}
export interface Report extends BaseReport {
  content_type: string; // e.g., 'post'
  reason: string; // e.g., 'Contenido inapropiado'
}