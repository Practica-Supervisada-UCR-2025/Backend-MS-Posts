import { getTotalPostsStatsService } from '../../src/features/posts/services/postStats.service';
import * as postStatsRepo from '../../src/features/posts/repositories/postStats.repository';
import { StatsQueryDTO } from '../../src/features/posts/dto/postStats.dto';

jest.mock('../../src/features/posts/repositories/postStats.repository');

describe('getTotalPostsStatsService', () => {
  const mockRepo = postStatsRepo.getPostCountsByPeriod as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct structure, total and sorted data (weekly)', async () => {
    const input: StatsQueryDTO = {
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      period: 'weekly',
    };

    const unorderedMock = [
      { label: '15-06-2025 al 21-06-2025', count: 8 },
      { label: '01-06-2025 al 07-06-2025', count: 5 },
      { label: '08-06-2025 al 14-06-2025', count: 2 },
    ];

    mockRepo.mockResolvedValueOnce(unorderedMock);

    const result = await getTotalPostsStatsService(input);

    expect(mockRepo).toHaveBeenCalledWith('2025-06-01', '2025-06-30', 'weekly');

    expect(result).toEqual({
      range: 'weekly',
      total: 15,
      data: [
        { label: '01-06-2025 al 07-06-2025', count: 5 },
        { label: '08-06-2025 al 14-06-2025', count: 2 },
        { label: '15-06-2025 al 21-06-2025', count: 8 },
      ],
    });
  });

  it('returns empty data and total = 0 when repo returns empty array', async () => {
    const input: StatsQueryDTO = {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      period: 'daily',
    };

    mockRepo.mockResolvedValueOnce([]);

    const result = await getTotalPostsStatsService(input);

    expect(result).toEqual({
      range: 'daily',
      total: 0,
      data: [],
    });
  });
});
