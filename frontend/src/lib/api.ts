const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000/api";

export type ApiError = {
  error?: string;
  details?: unknown;
};

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as unknown;

  if (!res.ok) {
    const msg = (data as ApiError)?.error || "Något gick fel";
    throw new Error(msg);
  }

  return data as T;
}

