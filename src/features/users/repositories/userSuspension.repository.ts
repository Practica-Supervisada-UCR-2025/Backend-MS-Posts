import client from '../../../config/database';

export const isUserSuspended = async (userId: string): Promise<boolean> => {
    const query = `
    SELECT 1
    FROM user_suspensions
    WHERE user_id = $1
      AND start_date <= NOW()
      AND end_date > NOW()
    LIMIT 1;
  `;
    const result = await client.query(query, [userId]);
    return result.rows.length > 0;
};