"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  workspace_id: string;
  role: "super_admin" | "admin" | "member";
}

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  profile: null,
  isSuperAdmin: false,
  loading: true,
  signOut: async () => {},
});

async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.warn("Profile fetch failed:", error.message);
      return null;
    }
    return data as Profile;
  } catch (e) {
    console.warn("Profile fetch threw:", e);
    return null;
  }
}

// Wraps a promise with a timeout — resolves with fallback if it takes too long
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let cancelled = false;

    async function init() {
      try {
        // Add a 6s timeout in case the auth lock hangs
        const { data } = await withTimeout(
          supabase.auth.getUser(),
          6000,
          { data: { user: null }, error: null } as any
        );

        const u = data?.user ?? null;
        if (cancelled) return;
        setUser(u);

        if (u) {
          const p = await fetchProfile(supabase, u.id);
          if (cancelled) return;
          setProfile(p);
        }
      } catch (e) {
        console.warn("Auth init failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await fetchProfile(supabase, u.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        isSuperAdmin: profile?.role === "super_admin",
        loading,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
