"use client";

import { useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await db
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) setUser({ ...profile, auth: session.user } as AuthUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        setSession(session);
        if (session?.user) {
          const { data: profile } = await db
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (profile) setUser({ ...profile, auth: session.user } as AuthUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
