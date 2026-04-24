import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  // US1: logout nhận reason để hiện đúng message trên login page
  logout: (reason?: "user_action" | "session_expired") => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ale_farms_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem("ale_farms_user"); }
    }
    setIsAuthLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: User }>("/api/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      localStorage.setItem("ale_farms_user",  JSON.stringify(data.user));
      localStorage.setItem("ale_farms_token", data.token);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch("/api/users/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      });
      return await login(email, password);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // US1: logout với reason
  const logout = (reason: "user_action" | "session_expired" = "user_action") => {
    setUser(null);
    localStorage.removeItem("ale_farms_user");
    localStorage.removeItem("ale_farms_token");
    // Lưu message vào sessionStorage để AuthPage đọc
    if (reason === "user_action") {
      sessionStorage.setItem("ale_auth_message", "signed_out");
    } else {
      sessionStorage.setItem("ale_auth_message", "session_expired");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAuthLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}