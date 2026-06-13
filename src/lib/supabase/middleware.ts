import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() instead of getUser() — reads from cookies, no network call.
  // getUser() validates with Supabase API on every request which can timeout on
  // Vercel free tier and falsely return null, redirecting authenticated users to login.
  // Race against a 4 s timeout so a slow token-refresh never blocks navigation.
  const sessionResult = await Promise.race([
    supabase.auth.getSession(),
    new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 4000)
    ),
  ]);
  const { data: { session } } = sessionResult;
  const user = session?.user ?? null;

  const protectedRoutes = ["/dashboard", "/fixtures", "/predictions", "/rankings", "/selecciones", "/estadisticas", "/profile", "/admin", "/en-vivo", "/noticias"];
  const authRoutes = ["/auth/login", "/auth/register"];
  const pathname = request.nextUrl.pathname;

  // Only redirect to login if BOTH the session is null AND no Supabase auth
  // cookie exists. This avoids a false logout when getSession() times out but
  // the user has valid cookies (e.g. token refresh temporarily slow on Vercel).
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && (c.name.includes("-auth-token") || c.name.includes("-access-token"))
  );

  if (!user && !hasAuthCookie && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
