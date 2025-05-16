// src/utils/validationUtils.ts

/**
 * Validates sorting parameters for reported posts
 * @param orderBy - Field to sort by (created_at, report_count, username)
 * @param orderDirection - Sort direction (asc or desc)
 * @throws Error if parameters are invalid
 */
export function validateSortingParams(orderBy: string, orderDirection: string) {
    const validFields = ['created_at', 'report_count', 'username'];
    const validDirections = ['asc', 'desc'];

    if (!validFields.includes(orderBy)) {
        throw new Error(`Invalid orderBy field. Allowed values: ${validFields.join(', ')}`);
    }

    if (!validDirections.includes(orderDirection)) {
        throw new Error(`Invalid orderDirection. Allowed values: ${validDirections.join(', ')}`);
    }
}
