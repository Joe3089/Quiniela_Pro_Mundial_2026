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

  // Attempt to get session — must complete fully so token-refresh cookies are
  // written back. A race timeout would prevent cookie updates and eventually
  // cause the session to become unrecoverable (expired + no refresh).
  let user = null;
  let sessionAttempted = false;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
    sessionAttempted = true;
  } catch {
    // Network/timeout error — fall through to cookie check below
  }

  const protectedRoutes = ["/dashboard", "/fixtures", "/predictions", "/rankings", "/selecciones", "/estadisticas", "/profile", "/admin", "/en-vivo", "/noticias"];
  const authRoutes = ["/auth/login", "/auth/register"];
  const pathname = request.nextUrl.pathname;

  // Accept ANY sb-*-auth-token cookie (chunked or not) as proof of a prior
  // authenticated session. Supabase stores the JWT as:
  //   sb-<project-ref>-auth-token       (small sessions)
  //   sb-<project-ref>-auth-token.0     (chunked, part 0)
  //   sb-<project-ref>-auth-token.1     (chunked, part 1)  …
  // Checking the prefix covers every format and prevents false logouts when
  // getSession() encounters a transient error on cold starts.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  // Only redirect to login if we definitively have NO session AND NO auth cookie.
  // If getSession() failed (sessionAttempted=false) we trust the cookie alone.
  if (!user && !hasAuthCookie && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Only redirect authenticated users away from auth routes when session is
  // confirmed (not just cookie presence) to avoid redirect loops.
  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
