export interface BasePost {
  id: string;
  content?: string; // could be null, but it is a required field, max length 300
  file_url?: string; // Could be null, but it is a required field, it is a URL to the file (stored in UploadThing) 
  media_type?: number; // in bytes, max size 5MB
  created_at: Date;
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
