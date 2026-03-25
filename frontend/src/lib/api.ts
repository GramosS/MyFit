// HTTP-klient mot backend.
// register/login använder `postJson`.
// Skyddade routes använder Bearer-token via auth-funktioner.
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000/api";

export type ApiError = {
  error?: string;
  details?: unknown;
};

// Läser JSON. Om `!res.ok` kastas Error med `.status`.
async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const msg = (data as ApiError)?.error || "Något gick fel";
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

// Ingen Authorization-header här (bara register/login).
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function getJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<T>(res);
}

export async function postJsonAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function putJsonAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

// DELETE kan svara 204 utan svarskropp.
export async function deleteJsonAuth(path: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return;
  await parseResponse<unknown>(res);
}
