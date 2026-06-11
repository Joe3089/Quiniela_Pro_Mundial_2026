import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    // Build the redirect response first so we can set cookies directly on it.
    // Using next/headers cookies() in a GET Route Handler is unreliable in
    // Next.js 16 — the store can be read-only and the silent try/catch in
    // server.ts would swallow the error, leaving no Set-Cookie headers in the
    // redirect response and breaking the session.
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("cookie") ?? "";
            if (!cookieHeader) return [];
            return cookieHeader.split(";").reduce<{ name: string; value: string }[]>(
              (acc, raw) => {
                const eqIdx = raw.indexOf("=");
                if (eqIdx === -1) return acc;
                const name = raw.slice(0, eqIdx).trim();
                const value = raw.slice(eqIdx + 1).trim();
                if (name) acc.push({ name, value });
                return acc;
              },
              []
            );
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options ?? {});
            });
          },
        },
      }
    );

    const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[Callback] exchange:", error ? `ERROR: ${error.message}` : `OK user=${exchangeData?.user?.email}`);
    console.log("[Callback] cookies set:", response.cookies.getAll().map((c) => c.name));

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
