import { csrfService } from '../csrf/csrfService';

export class ApiRequestError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  skipCsrf?: boolean;
}

async function request<T>(
  url: string,
  options: RequestOptions = {},
  isRetry: boolean = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (isStateChanging && !options.skipCsrf) {
    try {
      const token = await csrfService.fetchToken();
      headers.set(csrfService.getHeaderName(), token);
    } catch (err) {
      console.warn('Failed to attach CSRF token before request:', err);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 403 && isStateChanging && !isRetry) {
    // Possibly expired or invalid CSRF token, retry once with refreshed token
    try {
      await csrfService.fetchToken(true);
      return request<T>(url, options, true);
    } catch {
      // Fall through to standard error handling
    }
  }

  if (!response.ok) {
    let errorData: any = null;
    let errorMessage = `HTTP Error ${response.status}`;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch {
      // Ignore parsing error
    }

    throw new ApiRequestError(response.status, errorMessage, errorData);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
