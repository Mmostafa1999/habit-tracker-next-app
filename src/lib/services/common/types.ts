/**
 * Common service layer types and interfaces
 */

export enum Result {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface ServiceResult<T> {
  result: Result;
  data?: T;
  error?: ApiError;
}

export interface BaseService {
  initialize(): Promise<void>;
}

/**
 * Creates a successful service result
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    result: Result.SUCCESS,
    data,
  };
}

/**
 * Creates an error service result
 */
export function createErrorResult<T>(
  error: ApiError | Error | string,
  status?: number,
): ServiceResult<T> {
  if (typeof error === "string") {
    return {
      result: Result.ERROR,
      error: new ApiError(error, "UNKNOWN_ERROR", status),
    };
  } else if (error instanceof ApiError) {
    return {
      result: Result.ERROR,
      error,
    };
  } else {
    return {
      result: Result.ERROR,
      error: new ApiError(error.message, "UNKNOWN_ERROR", status),
    };
  }
}
