export interface BasePost {
  id: string;
  uuid: string; // UUID of the user who created the post, it is a foreign key
  text: string; // could be null, but it is a required field, max length 300
  file_url: string; // Could be null, but it is a required field, it is a URL to the file (stored in UploadThing) 
  file_type: string; // (.jpg, .jpeg, .png, .webp, .gif).
  file_size: number; // in bytes, max size 5MB
  created_at: Date;
  state: string; // visible, not_visible, hidden (a soft delete)
}

export interface Post extends BasePost {
}

