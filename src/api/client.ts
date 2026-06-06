import type { ApiError, ApiResponse } from '@text-master/shared';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body,
  });
}

async function apiRequest<T>(
  path: string,
  options: {
    method: 'GET' | 'POST' | 'PATCH';
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | ApiError | null;

  if (!response.ok) {
    const error = payload && 'success' in payload && payload.success === false ? payload.error : null;
    throw new Error(error?.message ?? `API request failed with status ${response.status}`);
  }

  if (!payload || !('success' in payload) || payload.success !== true) {
    throw new Error('API response shape is invalid');
  }

  return payload.data;
}
