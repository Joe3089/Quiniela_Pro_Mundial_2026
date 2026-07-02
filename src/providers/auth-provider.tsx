"use client";

import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { wasExplicitSignOut, clearExplicitSignOut } from "@/lib/auth-flags";
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
    let signedOutTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. getSession() as primary bootstrap.
    //    If a session exists, immediately call refreshSession() to ensure the
    //    auth cookie is (re-)written with path:"/" via our createBrowserClient
    //    cookieOptions. This fixes existing sessions whose cookies were
    //    originally set without a path (scoped to /auth/login only), which
    //    caused the middleware to see no auth cookie on other routes.
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (session?.user) {
        // Silently refresh — sets fresh cookies with path:"/".
        // Ignore errors: if refresh token is expired the user stays logged in
        // via the current access token until it expires naturally.
        supabase.auth.refreshSession().catch(() => {});
        await resolveUser(db, session, setUser);
        setSession(session);
      } else {
        setSession(null);
      }
      setLoading(false);
      setInitialized();
    });

    // 2. onAuthStateChange keeps the store in sync.
    //    SIGNED_OUT is debounced by 600ms to avoid flashing the login state
    //    during token-refresh cycles where Supabase briefly fires SIGNED_OUT
    //    before the new SIGNED_IN / TOKEN_REFRESHED event. Without this debounce,
    //    the navbar briefly shows login buttons mid-navigation, and if the user
    //    clicks a protected link at that exact moment they're sent to /auth/login.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setInitialized();
      setSession(session);

      if (session?.user) {
        // Cancel any pending sign-out clear
        if (signedOutTimer) { clearTimeout(signedOutTimer); signedOutTimer = null; }
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
        resolveUser(db, session, setUser);
      } else if (event === "SIGNED_OUT") {
        const explicit = wasExplicitSignOut();
        clearExplicitSignOut();
        // Delay 600 ms so TOKEN_REFRESHED can follow without a flash.
        // If no TOKEN_REFRESHED arrives the session is genuinely expired.
        signedOutTimer = setTimeout(() => {
          setUser(null);
          setLoading(false);
          signedOutTimer = null;
          if (!explicit) {
            const PROTECTED = [
              "/dashboard", "/fixtures", "/predictions", "/rankings",
              "/selecciones", "/estadisticas", "/profile", "/admin",
              "/en-vivo", "/noticias",
            ];
            const pathname = window.location.pathname;
            if (PROTECTED.some((p) => pathname.startsWith(p))) {
              // Hard navigation — bypasses RSC cache and forces middleware check.
              window.location.replace(
                `/auth/login?redirectTo=${encodeURIComponent(pathname)}&reason=session_expired`
              );
            } else {
              toast.warning("Tu sesión expiró", {
                description: "Por favor inicia sesión nuevamente para continuar.",
                duration: 8000,
                action: { label: "Iniciar sesión", onClick: () => { window.location.href = "/auth/login"; } },
              });
            }
          }
        }, 600);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (signedOutTimer) clearTimeout(signedOutTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
