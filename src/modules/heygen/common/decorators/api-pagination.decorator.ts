import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IPaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  sortableFields?: string[];
}

export const ApiPagination = createParamDecorator(
  (options: IPaginationOptions = {}, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const {
      defaultLimit = 10,
      maxLimit = 100,
      sortableFields = ['createdAt', 'updatedAt', 'id']
    } = options;

    // Parse page
    let page = parseInt(query.page, 10);
    page = isNaN(page) || page < 1 ? 1 : page;

    // Parse limit
    let limit = parseInt(query.limit, 10);
    limit = isNaN(limit) ? defaultLimit : Math.min(limit, maxLimit);

    // Parse search
    const search = query.search?.trim() || '';

    // Parse sort
    let sortBy = query.sortBy || 'createdAt';
    let sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Validate sortable fields
    if (!sortableFields.includes(sortBy)) {
      sortBy = 'createdAt';
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
      getPaginationResponse(total: number) {
        return {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        };
      },
    };
  },
);