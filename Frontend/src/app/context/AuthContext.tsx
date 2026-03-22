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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ale_farms_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem("ale_farms_user"); }
    }
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
      // Tự động login sau khi đăng ký thành công
      return await login(email, password);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ale_farms_user");
    localStorage.removeItem("ale_farms_token");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}