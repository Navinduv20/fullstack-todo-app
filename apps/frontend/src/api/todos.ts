import type { ApiErrorBody, Todo, TodoValues } from '@todo/shared';
import { strings } from '../utils/strings';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const REQUEST_TIMEOUT_MS = 5000;
const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/todos`;

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      keepalive: true, // lets a pending delete finish while the tab closes
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', 'Request timed out');
    }
    throw new ApiError(0, 'NETWORK', 'Network request failed');
  }
  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (json as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `HTTP ${res.status}`,
    );
  }
  return json as T;
}

export const todosApi = {
  list: () => request<Todo[]>(''),
  create: (input: TodoValues) => request<Todo>('', 'POST', input),
  update: (id: string, input: TodoValues) => request<Todo>(`/${id}`, 'PUT', input),
  toggle: (id: string) => request<Todo>(`/${id}/done`, 'PATCH'),
  remove: (id: string) => request<void>(`/${id}`, 'DELETE'),
};

// Backend or DB down: worth asking again. A timeout already used its 5s, and 4xx won't change.
export function isRetryable(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.code === 'TIMEOUT') return false;
  return err.status === 0 || err.status >= 500;
}

export function toUserMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return strings.errors.unknown;
  if (err.code === 'TIMEOUT' || err.status === 503) return strings.errors.unavailable;
  if (err.status === 0) return strings.errors.network;
  if (err.status === 404) return strings.errors.notFound;
  if (err.status === 400) return err.message;
  if (err.status === 429) return strings.errors.rateLimited;
  return strings.errors.unknown;
}
