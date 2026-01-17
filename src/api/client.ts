import type { ApiErrorResponse } from './types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Ensure cookies are sent
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 - redirect to login (except for auth/me endpoint)
    if (response.status === 401 && !endpoint.includes('/auth/me')) {
      const returnUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/login?return_url=${returnUrl}`;
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
    }

    let error: ApiErrorResponse = { error: 'Request failed' };
    try {
      error = await response.json();
    } catch {
      // Ignore parse error
    }
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN',
      error.error || 'Request failed'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
