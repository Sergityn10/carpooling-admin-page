import { env } from "../env";

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export type ApiName = "users" | "travels" | "notifications";

const STORAGE_KEY = "youconnext_admin_auth";

function getBaseUrl(api: ApiName): string {
  const base =
    api === "users"
      ? (env.usersApiBaseUrl ?? "http://localhost:4000")
      : api === "travels"
        ? (env.travelsApiBaseUrl ?? "http://localhost:4001")
        : (env.notificationsApiBaseUrl ?? "http://localhost:3004");
  return base.replace(/\/$/, "");
}

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

function setAuthToken(token: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.token = token;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Token refresh ───

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${getBaseUrl("users")}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.token) {
      setAuthToken(data.token);
      return data.token as string;
    }
    return null;
  } catch {
    return null;
  }
}

function refreshToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ─── HTTP core ───

async function rawFetch<T>(
  api: ApiName,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${getBaseUrl(api)}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        ...(init?.headers ?? {}),
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const body = isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    if (!res.ok) {
      const message =
        typeof body === "object" && body
          ? String(
              (body as any).message ??
                (body as any).error ??
                `HTTP ${res.status}`,
            )
          : `HTTP ${res.status}`;
      throw new HttpError(message, res.status, body);
    }

    return body as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Binary download ───

async function rawFetchBlob(
  api: ApiName,
  path: string,
  init?: RequestInit,
): Promise<Blob> {
  const token = getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${getBaseUrl(api)}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => null);
      const message =
        typeof body === "object" && body
          ? String(
              (body as any).message ??
                (body as any).error ??
                `HTTP ${res.status}`,
            )
          : `HTTP ${res.status}`;
      throw new HttpError(message, res.status, body);
    }

    return await res.blob();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function httpBlob(
  api: ApiName,
  path: string,
  init?: RequestInit & { skipRefresh?: boolean },
): Promise<Blob> {
  try {
    return await rawFetchBlob(api, path, init);
  } catch (err) {
    if (
      err instanceof HttpError &&
      err.status === 401 &&
      !init?.skipRefresh &&
      getAuthToken()
    ) {
      const newToken = await refreshToken();
      if (newToken) {
        return rawFetchBlob(api, path, {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      clearAuthToken();
    }
    throw err;
  }
}

export async function http<T>(
  api: ApiName,
  path: string,
  init?: RequestInit & { skipRefresh?: boolean },
): Promise<T> {
  try {
    return await rawFetch<T>(api, path, init);
  } catch (err) {
    if (
      err instanceof HttpError &&
      err.status === 401 &&
      !init?.skipRefresh &&
      getAuthToken()
    ) {
      const newToken = await refreshToken();
      if (newToken) {
        return rawFetch<T>(api, path, {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      clearAuthToken();
    }
    throw err;
  }
}
