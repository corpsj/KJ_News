"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_KEY = "kj_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      /* empty */
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === "admin" && password === "1234") {
      const u: User = { username };
      setUser(u);
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(AUTH_KEY);
    router.push("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
