import { getCommentsByPostId, countCommentsByPostId } from '../../src/features/posts/repositories/comment.repository';
import client from '../../src/config/database';
import { QueryResult } from 'pg';

jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
}));

const mockClient = client as unknown as { query: jest.Mock };

describe('Comment Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCommentsByPostId', () => {
        it('should return comments for given post', async () => {
            const rows = [
                { id: '1', content: 'hi', username: 'alice', created_at: new Date() },
            ];
            mockClient.query.mockResolvedValueOnce({
                rows,
                rowCount: rows.length,
                command: '',
                oid: 0,
                fields: [],
            } as QueryResult);

            const result = await getCommentsByPostId('p1', new Date('2024-01-01'), 0, 5);

            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('FROM comments'), ['p1', new Date('2024-01-01'), 5, 0]);
            expect(result).toEqual(rows);
        });

        it('applies pagination offset correctly', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
                command: '',
                oid: 0,
                fields: [],
            } as QueryResult);

            await getCommentsByPostId('p1', new Date('2024-01-01'), 1, 5);

            expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['p1', new Date('2024-01-01'), 5, 5]);
        });
    });

    describe('countCommentsByPostId', () => {
        it('should return comment count', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [{ count: '3' }] } as QueryResult);

            const count = await countCommentsByPostId('p1');

            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) FROM comments'), ['p1']);
            expect(count).toBe(3);
        });
    });
});