import { getPostComments } from '../../src/features/posts/services/commentCrud.service';
import * as commentRepo from '../../src/features/posts/repositories/comment.repository';
import * as postRepo from '../../src/features/posts/repositories/post.repository';
import { NotFoundError, InternalServerError } from '../../src/utils/errors/api-error';
import { createComment } from '../../src/features/posts/services/commentCrud.service';
import * as repository from '../../src/features/posts/repositories/post.crud.repository';
import * as postCrudService from '../../src/features/posts/services/postCrud.service';

jest.mock('../../src/features/posts/repositories/comment.repository');
jest.mock('../../src/features/posts/repositories/post.repository');
jest.mock('../../src/features/posts/repositories/post.crud.repository');

const mockedFindPostById = jest.mocked(postRepo.findPostById);
const mockedGetComments = jest.mocked(commentRepo.getCommentsByPostId);
const mockedCount = jest.mocked(commentRepo.countCommentsByPostId);

describe('getPostComments service', () => {
    const dto = { index: 0, startTime: new Date('2024-01-01') };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns comments and metadata when post exists', async () => {
        mockedFindPostById.mockResolvedValue({ id: 'p1' } as any);
        const comments = [{ id: '1', content: 'hi', username: 'alice', created_at: new Date() }];
        mockedGetComments.mockResolvedValue(comments);
        mockedCount.mockResolvedValue(1);

        const result = await getPostComments('p1', dto);

        expect(result).toEqual({
            message: 'Comments fetched successfully',
            comments,
            metadata: { totalItems: 1, currentIndex: 0 },
        });
        expect(mockedGetComments).toHaveBeenCalledWith('p1', dto.startTime, 0, 5);
    });

    it('throws NotFoundError when post not found', async () => {
        mockedFindPostById.mockResolvedValue(null);
        await expect(getPostComments('p1', dto)).rejects.toThrow(NotFoundError);
    });

    it('wraps repository errors in InternalServerError', async () => {
        mockedFindPostById.mockResolvedValue({ id: 'p1' } as any);
        mockedGetComments.mockRejectedValue(new Error('db')); // or count

        await expect(getPostComments('p1', dto)).rejects.toThrow(InternalServerError);
    });
});

const mockUploadFileToMicroservice = jest.spyOn(postCrudService, 'uploadFileToMicroservice');

describe('createComment', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('crea un comentario sin archivo', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 1 });
        (commentRepo.createCommentDB as jest.Mock).mockResolvedValue({
            id: 'uuid',
            content: 'Hola comentario',
            user_id: 1,
            post_id: 'post1',
            file_url: null,
            file_size: null,
            media_type: null,
            is_active: true,
            is_edited: false,
            status: 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        });
        const comment = { content: 'Hola comentario', postId: 'post1' };

        const result = await createComment('test@mail.com', 'token', comment);

        expect(result).toEqual({
            message: 'Comment created successfully',
            comment: {
                id: 'uuid',
                content: 'Hola comentario',
                user_id: 1,
                post_id: 'post1',
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

    it('crea un comentario con archivo', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 2 });
        (commentRepo.createCommentDB as jest.Mock).mockResolvedValue({
            id: 'uuid',
            content: 'Con archivo',
            user_id: 2,
            post_id: 'post2',
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
        const comment = { content: 'Con archivo', postId: 'post2', mediaType: 1 };

        const result = await createComment('otro@mail.com', 'token', comment, file);

        expect(result).toEqual({
            message: 'Comment created successfully',
            comment: {
                id: 'uuid',
                content: 'Con archivo',
                user_id: 2,
                post_id: 'post2',
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

    it('crea un comentario con gif (mediaType 2)', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 3 });
        (commentRepo.createCommentDB as jest.Mock).mockResolvedValue({
            id: 'uuid',
            content: 'Con gif',
            user_id: 3,
            post_id: 'post3',
            file_url: 'http://gif.com/anim.gif',
            file_size: undefined,
            media_type: 2,
            is_active: true,
            is_edited: false,
            status: 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        });
        const comment = { content: 'Con gif', postId: 'post3', mediaType: 2, gifUrl: 'http://gif.com/anim.gif' };

        const result = await createComment('gif@mail.com', 'token', comment);

        expect(result).toEqual({
            message: 'Comment created successfully',
            comment: {
                id: 'uuid',
                content: 'Con gif',
                user_id: 3,
                post_id: 'post3',
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

    it('crea un comentario con mediaType definido pero sin archivo ni gifUrl', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 4 });
        (commentRepo.createCommentDB as jest.Mock).mockResolvedValue({
            id: 'uuid',
            content: 'Solo mediaType',
            user_id: 4,
            post_id: 'post4',
            file_url: undefined,
            file_size: undefined,
            media_type: 1,
            is_active: true,
            is_edited: false,
            status: 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        });
        const comment = { content: 'Solo mediaType', postId: 'post4', mediaType: 1 };

        const result = await createComment('media@mail.com', 'token', comment);

        expect(result).toEqual({
            message: 'Comment created successfully',
            comment: {
                id: 'uuid',
                content: 'Solo mediaType',
                user_id: 4,
                post_id: 'post4',
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

    it('lanza error si createCommentDB falla', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 5 });
        (commentRepo.createCommentDB as jest.Mock).mockRejectedValue(new Error('DB error'));
        const comment = { content: 'Error DB', postId: 'post5' };

        await expect(
            createComment('fail@mail.com', 'token', comment)
        ).rejects.toThrow('DB error');
    });

    it('lanza error si uploadFileToMicroservice falla', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 6 });
        mockUploadFileToMicroservice.mockRejectedValue(new Error('Upload error'));
        const file: any = {
            buffer: Buffer.from('test'),
            originalname: 'file.png',
            mimetype: 'image/png',
            size: 123,
            fieldname: 'file',
        };
        const comment = { content: 'Con archivo', postId: 'post6', mediaType: 1 };

        await expect(
            createComment('failupload@mail.com', 'token', comment, file)
        ).rejects.toThrow('Upload error');
    });

    it('pasa mediaType y gifUrl correctamente', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue({ id: 7 });
        (commentRepo.createCommentDB as jest.Mock).mockResolvedValue({
            id: 'uuid',
            content: 'Gif correcto',
            user_id: 7,
            post_id: 'post7',
            file_url: 'http://gif.com/anim.gif',
            file_size: undefined,
            media_type: 2,
            is_active: true,
            is_edited: false,
            status: 0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        });
        const comment = { content: 'Gif correcto', postId: 'post7', mediaType: 2, gifUrl: 'http://gif.com/anim.gif' };

        const result = await createComment('gif2@mail.com', 'token', comment);

        expect(result.comment.file_url).toBe('http://gif.com/anim.gif');
        expect(result.comment.media_type).toBe(2);
        expect(mockUploadFileToMicroservice).not.toHaveBeenCalled();
    });

    it('lanza error si el usuario no existe', async () => {
        (repository.findByEmailUser as jest.Mock).mockResolvedValue(null);
        const comment = { content: 'Hola', postId: 'post8' };

        await expect(
            createComment('noexiste@mail.com', 'token', comment)
        ).rejects.toThrow('User not found');
    });

    afterAll(() => {
        mockUploadFileToMicroservice.mockRestore();
    });
});