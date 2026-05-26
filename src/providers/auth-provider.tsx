"use client";

import { useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/auth";

async function fetchOrCreateProfile(db: any, session: any): Promise<AuthUser | null> {
  const userId = session.user.id;

  // Try to fetch existing profile
  const { data: profile } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    return { ...profile, auth: session.user } as AuthUser;
  }

  // Profile doesn't exist yet (first Google OAuth login) — create it
  const meta = session.user.user_metadata ?? {};
  const email = session.user.email ?? "";
  const displayName = meta.full_name ?? meta.name ?? email.split("@")[0];
  const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

  const { data: newProfile } = await db
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        username,
        avatar_url: avatarUrl,
        is_admin: false,
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (newProfile) {
    return { ...newProfile, auth: session.user } as AuthUser;
  }

  // Fallback: return minimal user from session data if upsert also fails
  return {
    id: userId,
    email,
    display_name: displayName,
    username,
    avatar_url: avatarUrl,
    is_admin: false,
    auth: session.user,
  } as AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    const db = supabase as any;

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
      if (session?.user) {
        const user = await fetchOrCreateProfile(db, session);
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes (covers OAuth redirects, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        setSession(session);
        if (session?.user) {
          const user = await fetchOrCreateProfile(db, session);
          setUser(user);
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
