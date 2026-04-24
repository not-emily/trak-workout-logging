import { ApiError, type ApiErrorBody } from "@/types/api";
import { snakeToCamel, camelToSnake } from "@/lib/caseMap";
import { clearToken, getToken, setToken } from "./authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type ApiClientEvent = "unauthorized";
type Listener = () => void;
const listeners: Record<ApiClientEvent, Set<Listener>> = {
  unauthorized: new Set(),
};

export function onApiEvent(event: ApiClientEvent, cb: Listener): () => void {
  listeners[event].add(cb);
  return () => listeners[event].delete(cb);
}

function emit(event: ApiClientEvent) {
  for (const cb of listeners[event]) cb();
}

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(camelToSnake(body)) : undefined,
  });

  const refreshed = res.headers.get("X-Refreshed-Token");
  if (refreshed) setToken(refreshed);

  if (res.status === 401) {
    clearToken();
    emit("unauthorized");
  }

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, (parsed as ApiErrorBody) ?? { error: `HTTP ${res.status}` });
  }

  return snakeToCamel(parsed);
}

export const apiClient = {
  get: (path: string) => request("GET", path),
  post: (path: string, body: unknown) => request("POST", path, body),
  put: (path: string, body: unknown) => request("PUT", path, body),
  delete: (path: string) => request("DELETE", path),
};
