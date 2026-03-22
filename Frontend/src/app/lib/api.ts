const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("ale_farms_token");

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || "API error");
  }

  return res.json();
}