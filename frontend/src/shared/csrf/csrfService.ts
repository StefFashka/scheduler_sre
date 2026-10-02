import type { CsrfResponse } from '../types';

let cachedToken: string | null = null;
let cachedHeaderName: string = 'X-CSRF-TOKEN';
let fetchPromise: Promise<string> | null = null;

export const csrfService = {
  getCsrfToken(): string | null {
    return cachedToken;
  },

  getHeaderName(): string {
    return cachedHeaderName;
  },

  clearToken(): void {
    cachedToken = null;
    fetchPromise = null;
  },

  async fetchToken(force: boolean = false): Promise<string> {
    if (cachedToken && !force) {
      return cachedToken;
    }

    if (fetchPromise && !force) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const response = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }

        const data: CsrfResponse = await response.json();
        cachedToken = data.token;
        if (data.headerName) {
          cachedHeaderName = data.headerName;
        }
        return cachedToken;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },
};
