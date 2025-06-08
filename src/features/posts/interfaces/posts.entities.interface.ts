export interface BasePost {
  id: string;
  user_id: string;
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

export interface FeedPost extends BasePost {
  username: string;
  profile_picture_url: string;
}

export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface PaginatedTimeResponse<T> {
  message: string;
  data: T[];
  metadata: {
    remainingItems: number;
    remainingPages: number;
  };
}

export interface Post extends BasePost {}
