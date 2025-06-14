import * as postCrudService from '../../src/features/posts/services/postCrud.service';
import * as postCrudRepository from '../../src/features/posts/repositories/post.crud.repository';
import axios from 'axios';

jest.mock('../../src/features/posts/repositories/post.crud.repository');
jest.mock('axios');

describe('createPost', () => {
  // Solo mockeamos uploadFileToMicroservice aquí
  const mockUploadFileToMicroservice = jest.spyOn(postCrudService, 'uploadFileToMicroservice');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea un post sin archivo', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 1 });
    (postCrudRepository.createPostDB as jest.Mock).mockResolvedValue({
      id: 'uuid',
      content: 'Hola mundo',
      user_id: 1,
      file_url: null,
      file_size: null,
      media_type: null,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });
    const post = { content: 'Hola mundo' };

    const result = await postCrudService.createPost('test@mail.com', 'token', post);

    expect(result).toEqual({
      message: 'Post created successfully',
      post: {
        id: 'uuid',
        content: 'Hola mundo',
        user_id: 1,
        file_url: null,
        file_size: null,
        media_type: null,
        is_active: true,
        is_edited: false,
        status: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    });
    expect(mockUploadFileToMicroservice).not.toHaveBeenCalled();
  });

  it('crea un post con archivo', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 2 });
    (postCrudRepository.createPostDB as jest.Mock).mockResolvedValue({
      id: 'uuid',
      content: 'Con archivo',
      user_id: 2,
      file_url: 'http://url.com/file.png',
      file_size: 123,
      media_type: 1,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });
    mockUploadFileToMicroservice.mockResolvedValue('http://url.com/file.png');
    const file: any = {
      buffer: Buffer.from('test'),
      originalname: 'file.png',
      mimetype: 'image/png',
      size: 123,
      fieldname: 'file',
    };
    const post = { content: 'Con archivo' };

    const result = await postCrudService.createPost('otro@mail.com', 'token', post, file);

    expect(result).toEqual({
      message: 'Post created successfully',
      post: {
      id: 'uuid',
      content: 'Con archivo',
      user_id: 2,
      file_url: 'http://url.com/file.png',
      file_size: 123,
      media_type: 1,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      },
    });
    expect(mockUploadFileToMicroservice).toHaveBeenCalledWith(file, 'token');
    });

    it('crea un post con gif (mediaType 2)', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 3 });
    (postCrudRepository.createPostDB as jest.Mock).mockResolvedValue({
      id: 'uuid',
      content: 'Con gif',
      user_id: 3,
      file_url: 'http://gif.com/anim.gif',
      file_size: undefined,
      media_type: 2,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });
    const post = { content: 'Con gif', mediaType: 2, gifUrl: 'http://gif.com/anim.gif' };

    const result = await postCrudService.createPost('gif@mail.com', 'token', post);

    expect(result).toEqual({
      message: 'Post created successfully',
      post: {
      id: 'uuid',
      content: 'Con gif',
      user_id: 3,
      file_url: 'http://gif.com/anim.gif',
      file_size: undefined,
      media_type: 2,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      },
    });
    expect(mockUploadFileToMicroservice).not.toHaveBeenCalled();
    });

    it('crea un post con mediaType definido pero sin archivo ni gifUrl', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 4 });
    (postCrudRepository.createPostDB as jest.Mock).mockResolvedValue({
      id: 'uuid',
      content: 'Solo mediaType',
      user_id: 4,
      file_url: undefined,
      file_size: undefined,
      media_type: 1,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });
    const post = { content: 'Solo mediaType', mediaType: 1 };

    const result = await postCrudService.createPost('media@mail.com', 'token', post);

    expect(result).toEqual({
      message: 'Post created successfully',
      post: {
      id: 'uuid',
      content: 'Solo mediaType',
      user_id: 4,
      file_url: undefined,
      file_size: undefined,
      media_type: 1,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      },
    });
    expect(mockUploadFileToMicroservice).not.toHaveBeenCalled();
    });

    it('lanza error si createPostDB falla', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 5 });
    (postCrudRepository.createPostDB as jest.Mock).mockRejectedValue(new Error('DB error'));
    const post = { content: 'Error DB' };

    await expect(
      postCrudService.createPost('fail@mail.com', 'token', post)
    ).rejects.toThrow('DB error');
    });

    it('lanza error si uploadFileToMicroservice falla', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 6 });
    mockUploadFileToMicroservice.mockRejectedValue(new Error('Upload error'));
    const file: any = {
      buffer: Buffer.from('test'),
      originalname: 'file.png',
      mimetype: 'image/png',
      size: 123,
      fieldname: 'file',
    };
    const post = { content: 'Con archivo' };

    await expect(
      postCrudService.createPost('failupload@mail.com', 'token', post, file)
    ).rejects.toThrow('Upload error');
    });

    it('pasa mediaType y gifUrl correctamente', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 7 });
    (postCrudRepository.createPostDB as jest.Mock).mockResolvedValue({
      id: 'uuid',
      content: 'Gif correcto',
      user_id: 7,
      file_url: 'http://gif.com/anim.gif',
      file_size: undefined,
      media_type: 2,
      is_active: true,
      is_edited: false,
      status: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });
    const post = { content: 'Gif correcto', mediaType: 2, gifUrl: 'http://gif.com/anim.gif' };

    const result = await postCrudService.createPost('gif2@mail.com', 'token', post);

    expect(result.post.file_url).toBe('http://gif.com/anim.gif');
    expect(result.post.media_type).toBe(2);
    expect(mockUploadFileToMicroservice).not.toHaveBeenCalled();
    });

    it('lanza error si el usuario no existe', async () => {
    (postCrudRepository.findByEmailUser as jest.Mock).mockResolvedValue(null);

    await expect(
      postCrudService.createPost('noexiste@mail.com', 'token', { content: 'Hola' })
    ).rejects.toThrow('User not found');
    });

    afterAll(() => {
    mockUploadFileToMicroservice.mockRestore();
    });
  });

  describe('uploadFileToMicroservice', () => {
    const file: any = {
    buffer: Buffer.from('test'),
    originalname: 'file.png',
    mimetype: 'image/png',
    size: 123,
    fieldname: 'file',
    };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanza error si la respuesta no es 200', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ status: 500 });

    await expect(
      postCrudService.uploadFileToMicroservice(file, 'token')
    ).rejects.toThrow('Error uploading file to microservice');
  });

  it('devuelve la url si la respuesta es 200', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: { fileUrl: 'http://url.com/file.png' },
    });

    const result = await postCrudService.uploadFileToMicroservice(file, 'token');
    expect(result).toBe('http://url.com/file.png');
  });
});

describe('getFeedPosts', () => {
  const mockDate = new Date('2025-06-09T10:00:00.000Z');
  const mockPosts = [
    { id: '1', content: 'Post 1', user_id: 'user-uuid', created_at: '2025-06-09T10:00:00.000Z' },
    { id: '2', content: 'Post 2', user_id: 'user-uuid', created_at: '2025-06-08T10:00:00.000Z' },
  ];
  const mockTotal = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns posts, metadata and message correctly', async () => {
    (postCrudRepository.getTotalVisiblePosts as jest.Mock).mockResolvedValueOnce(mockTotal);
    (postCrudRepository.findFeedPosts as jest.Mock).mockResolvedValueOnce(mockPosts);
    const result = await postCrudService.getFeedPosts(mockDate, 2);
    expect(result).toEqual({
      message: 'Posts retrieved successfully',
      data: mockPosts,
      metadata: {
        remainingItems: mockTotal - mockPosts.length,
        remainingPages: Math.ceil((mockTotal - mockPosts.length) / 2),
      },
    });
  });

  it('throws InternalServerError if getTotalVisiblePosts returns undefined', async () => {
    (postCrudRepository.getTotalVisiblePosts as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(postCrudService.getFeedPosts(mockDate, 2)).rejects.toThrow('Failed to fetch posts');
  });

  it('throws InternalServerError if findFeedPosts returns null', async () => {
    (postCrudRepository.getTotalVisiblePosts as jest.Mock).mockResolvedValueOnce(mockTotal);
    (postCrudRepository.findFeedPosts as jest.Mock).mockResolvedValueOnce(null);
    await expect(postCrudService.getFeedPosts(mockDate, 2)).rejects.toThrow('Failed to fetch posts');
  });

  it('throws InternalServerError if an unexpected error occurs', async () => {
    (postCrudRepository.getTotalVisiblePosts as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
    await expect(postCrudService.getFeedPosts(mockDate, 2)).rejects.toThrow('Failed to fetch posts');
  });
});