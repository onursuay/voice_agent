import 'server-only';

// Lean Meta Graph API client — used for CRM stage → Custom Audience / CAPI sync.
// Mirrors the reference implementation's shape (get / postForm / del) without
// pulling in its full dependency tree.

const META_GRAPH_VERSION = 'v23.0';
const BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface GraphError {
  message?: string;
  code?: number;
  error_subcode?: number;
  type?: string;
  error_user_msg?: string;
}

export interface GraphResult<T> {
  ok: boolean;
  data?: T;
  error?: GraphError;
}

export class MetaGraphClient {
  private accessToken: string;
  private timeout: number;

  constructor(opts: { accessToken: string; timeout?: number }) {
    this.accessToken = opts.accessToken;
    this.timeout = opts.timeout ?? 8000;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    params?: Record<string, string>,
    form?: URLSearchParams,
  ): Promise<GraphResult<T>> {
    const url = new URL(`${BASE}${path}`);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url.toString(), {
        method,
        headers: form
          ? { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' }
          : { Authorization: `Bearer ${this.accessToken}` },
        body: form ? form.toString() : undefined,
        cache: 'no-store',
        signal: controller.signal,
      });
      const text = await res.text();
      let json: unknown = {};
      try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }
      if (!res.ok) {
        const err = (json as { error?: GraphError })?.error;
        return { ok: false, error: err ?? { message: text || `status ${res.status}` } };
      }
      return { ok: true, data: json as T };
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError';
      return { ok: false, error: { message: aborted ? 'request_timeout' : (e instanceof Error ? e.message : String(e)) } };
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string, params?: Record<string, string>): Promise<GraphResult<T>> {
    return this.request<T>('GET', path, params);
  }

  postForm<T>(path: string, form: URLSearchParams): Promise<GraphResult<T>> {
    return this.request<T>('POST', path, undefined, form);
  }

  del<T>(path: string, form?: URLSearchParams): Promise<GraphResult<T>> {
    return this.request<T>('DELETE', path, undefined, form);
  }
}
