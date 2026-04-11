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

  // US1: Session expired — 401 trong lúc đang dùng app
  if (res.status === 401) {
    // Xóa session
    localStorage.removeItem("ale_farms_user");
    localStorage.removeItem("ale_farms_token");
    // Lưu message để AuthPage hiển thị
    sessionStorage.setItem("ale_auth_message", "session_expired");
    // Redirect về login
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || "API error");
  }

  return res.json();
}