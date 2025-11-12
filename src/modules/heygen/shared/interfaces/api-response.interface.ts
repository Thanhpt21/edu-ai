export interface IStandardResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: IApiError[];
  metadata?: {
    timestamp: Date;
    path?: string;
    requestId?: string;
    duration?: number;
  };
}

export interface IApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface IListResponse<T = any> extends IStandardResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic response types for consistent API responses
export type ApiResponse<T = any> = IStandardResponse<T>;
export type ListApiResponse<T = any> = IListResponse<T>;
export type PaginatedApiResponse<T = any> = IListResponse<T> & {
  pagination: Required<IListResponse<T>['pagination']>;
};