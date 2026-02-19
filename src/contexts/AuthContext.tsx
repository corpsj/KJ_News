"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: SupabaseUser | null): User | null {
  if (!user || !user.email) return null;
  const metadata = user.user_metadata as Record<string, string | undefined> | undefined;
  return {
    id: user.id,
    email: user.email,
    name: metadata?.name || metadata?.full_name || user.email,
    role: metadata?.role || "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(mapUser(data.session?.user ?? null));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(mapUser(nextSession?.user ?? null));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) return false;
      setSession(data.session);
      setUser(mapUser(data.session.user));
      return true;
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    router.push("/admin/login");
  }, [router, supabase]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!session, isLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
