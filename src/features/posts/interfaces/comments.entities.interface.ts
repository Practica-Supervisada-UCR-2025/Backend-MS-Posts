export interface BaseComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  content: string;
  file_url?: string;
  file_size?: number;
  media_type?: number;
  is_active?: boolean;
  is_edited?: boolean;
  status?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Comment extends BaseComment {}