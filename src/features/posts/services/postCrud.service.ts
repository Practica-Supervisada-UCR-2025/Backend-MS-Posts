// Add missing imports
import { PaginatedTimeResponse } from '../interfaces/posts.entities.interface';
import { getTotalVisiblePosts } from '../repositories/post.crud.repository';
import { InternalServerError } from '../../../utils/errors/api-error';
import axios from 'axios';
import FormData from 'form-data';
import { findByEmailUser, createPostDB, findFeedPosts } from '../repositories/post.crud.repository';
import { Post } from '../interfaces/posts.entities.interface';
import { v4 as uuidv4 } from 'uuid';

export const createPost = async (email: string, tokenAuth: string, post: any, file?: Express.Multer.File | null) => {
  let fileUrl: string | undefined = undefined;
  let fileSize: number | undefined = undefined;

  if (post.mediaType === 2) {
    fileUrl = post.gifUrl;
    fileSize = undefined;
  } else if (file) {
    fileUrl = await uploadFileToMicroservice(file, tokenAuth);
    fileSize = file.size;
  }

  const user = await findByEmailUser(email);
  if (!user) {
    throw new Error('User not found');
  }

  const newPostData: Partial<Post> = {
    id: uuidv4(),
    content: post.content,
    user_id: user.id,
    file_url: fileUrl,
    file_size: fileSize,
    media_type: post.mediaType,
    is_active: true,
    is_edited: false,
    status: 0,
  };

  const createdPost = await createPostDB(newPostData);

  return {
    message: 'Post created successfully',
    post: createdPost,
  };
};

export const uploadFileToMicroservice = async (file: Express.Multer.File, tokenAuth: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  formData.append('mediaType', file.fieldname === 'gifFile' ? 2 : 1);

  const headers = formData.getHeaders();
  headers['Authorization'] = `Bearer ${tokenAuth}`;


  const response = await axios.post(`http://${process.env.MS_FILES_URL}/api/files/upload`, formData, { headers });

  if (response.status !== 200) {
    throw new Error('Error uploading file to microservice');
  }

  return response.data.fileUrl;
};

export const getFeedPosts = async (date: Date, limit: number): Promise<PaginatedTimeResponse<Post>> => {
  try {
    // Fetch total posts count
    const totalItems = await getTotalVisiblePosts(date);
    if (totalItems === undefined) {
      throw new InternalServerError('Failed to fetch total posts');
    }

    console.log('Total items:', totalItems);

    // Fetch posts
    const posts = await findFeedPosts(date, limit);
    if (!posts) {
      throw new InternalServerError('Failed to fetch posts');
    }

     console.log('Data:', posts);

    // Calculate remaining items and pages
    const remainingItems = totalItems - posts.length;
    const remainingPages = Math.ceil(remainingItems / limit);

    return {
      message: 'Posts retrieved successfully',
      data: posts,
      metadata: {
        remainingItems,
        remainingPages,
      },
    };
  } catch (error) {
    throw new InternalServerError('Failed to fetch posts');
  }
}
