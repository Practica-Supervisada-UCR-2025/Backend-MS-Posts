import FormData from 'form-data';
import fetch from 'node-fetch';
import { findByEmailUser } from '../repositories/post.crud.repository';

export const createPost = async (email: string, tokenAuth: string, post: any, file?: Express.Multer.File | null) => {
  let fileUrl: string | null = null;
  let fileSize: number | undefined = undefined;
  let mediaType: number | undefined = undefined;

  if (file) {
    fileUrl = await uploadFileToMicroservice(file, tokenAuth);
    fileSize = file.size;
    mediaType = file.mimetype === 'image/gif' ? 2 : 1;
  }

  const user_id = findByEmailUser(email);

  const newPost = {
    user_id: user_id,
    content: post.content,
    file_url: fileUrl ?? null,
    file_size: fileSize,
    media_type: mediaType,
  };

  return {
    message: 'Post created successfully',
    post: newPost,
  };
};

export const uploadFileToMicroservice = async (file: Express.Multer.File, tokenAuth?: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  if (file.fieldname === 'gifFile') {
    formData.append('mediaType', 2);
  } else {
    formData.append('mediaType', 1);
  }

  const headers = formData.getHeaders ? formData.getHeaders() : {};
  if (tokenAuth) {
    headers['Authorization'] = `Bearer ${tokenAuth}`;
  }

  const response = await fetch('http://localhost:3006/api/files/upload', {
    method: 'POST',
    body: formData as any,
    headers,
  });

  if (!response.ok) {
    throw new Error('Error uploading file to microservice');
  }

  const data = await response.json() as { url: string };
  return data.url;
};