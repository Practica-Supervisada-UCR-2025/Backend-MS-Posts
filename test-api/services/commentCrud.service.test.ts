import { getPostComments } from '../../src/features/posts/services/commentCrud.service';
import * as commentRepo from '../../src/features/posts/repositories/comment.repository';
import * as postRepo from '../../src/features/posts/repositories/post.repository';
import { NotFoundError, InternalServerError } from '../../src/utils/errors/api-error';

jest.mock('../../src/features/posts/repositories/comment.repository');
jest.mock('../../src/features/posts/repositories/post.repository');

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