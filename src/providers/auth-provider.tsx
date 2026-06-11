"use client";

import { useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/auth";

// Emails that always receive admin rights regardless of DB state
const ADMIN_EMAILS = new Set([
  "ente522rock89@gmail.com",
  "1001.19687168.ucla@gmail.com",
]);

async function fetchOrCreateProfile(db: any, session: any): Promise<AuthUser | null> {
  const userId = session.user.id;
  const email = session.user.email ?? "";
  const isAdmin = ADMIN_EMAILS.has(email.toLowerCase());

  // Try to fetch existing profile
  const { data: profile } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    // Ensure admin flag stays correct for admin emails
    if (isAdmin && !profile.is_admin) {
      await db.from("users").update({ is_admin: true }).eq("id", userId);
      return { ...profile, is_admin: true, auth: session.user } as AuthUser;
    }
    return { ...profile, auth: session.user } as AuthUser;
  }

  // Profile doesn't exist yet (first login) — create it
  const meta = session.user.user_metadata ?? {};
  const displayName = meta.full_name ?? meta.name ?? email.split("@")[0];
  const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

  const { data: newProfile } = await db
    .from("users")
    .upsert(
      { id: userId, email, display_name: displayName, username, avatar_url: avatarUrl, is_admin: isAdmin },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (newProfile) return { ...newProfile, auth: session.user } as AuthUser;

  return {
    id: userId, email, display_name: displayName, username,
    avatar_url: avatarUrl, is_admin: isAdmin, auth: session.user,
  } as AuthUser;
}

async function resolveUser(db: any, session: any, setUser: (u: any) => void) {
  try {
    const user = await fetchOrCreateProfile(db, session);
    setUser(user);
  } catch {
    setUser({
      id: session.user.id,
      email: session.user.email ?? "",
      display_name:
        session.user.user_metadata?.full_name ??
        session.user.user_metadata?.name ??
        null,
      username: (session.user.email ?? "user").split("@")[0],
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      is_admin: false,
      auth: session.user,
    } as any);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    const db = supabase as any;

    // 1. getSession() as primary bootstrap — waits for supabase to finish
    //    reading cookies, so it reliably returns the session even right after
    //    an OAuth redirect. We only set user when a session exists; we let
    //    onAuthStateChange handle the signed-out case so there is no race where
    //    a slow getSession() resolves null and wipes a user already set by the
    //    auth-state listener.
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
      if (session?.user) {
        await resolveUser(db, session, setUser);
      }
      setLoading(false);
      setInitialized(); // mark session as confirmed even if null
    });

    // 2. onAuthStateChange keeps the store in sync for subsequent events
    //    (SIGNED_IN after OAuth redirect, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setInitialized();
      setSession(session);
      if (session?.user) {
        // Set minimal user immediately so the UI updates without waiting for the DB.
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          display_name:
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            null,
          username: (session.user.email ?? "user").split("@")[0],
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          is_admin: false,
          auth: session.user,
        } as any);
        setLoading(false);
        // Enrich with full DB profile in the background (non-blocking).
        resolveUser(db, session, setUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
