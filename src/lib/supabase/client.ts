import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Ensure the session cookie is available on ALL paths, not just the
        // path where the login happened (e.g. /auth/login). Without path: '/',
        // the browser only sends the cookie when the request path starts with
        // /auth/, causing middleware to see no session on /fixtures, /dashboard
        // etc. and incorrectly redirecting to the login page.
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
      },
    }
  );
}
