export type ApiSuccess<T> = { data: T };

export type ApiValidationError = {
  error: string;
  errors?: Record<string, string[]>;
};

export type ApiErrorBody = { error: string; errors?: Record<string, string[]> };

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}
