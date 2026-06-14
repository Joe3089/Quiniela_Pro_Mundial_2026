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
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  } catch {
    // Network/timeout error — fall through to cookie check below
  }

  const protectedRoutes = ["/dashboard", "/fixtures", "/predictions", "/rankings", "/selecciones", "/estadisticas", "/profile", "/admin", "/en-vivo", "/noticias"];
  const authRoutes = ["/auth/login", "/auth/register"];
  const pathname = request.nextUrl.pathname;

  // Accept ANY sb- cookie as proof of prior authentication.
  // Supabase SSR stores the auth token as sb-<project-ref>-auth-token
  // (possibly chunked as .0, .1, …). Checking just the prefix covers all
  // formats and avoids false logouts when getSession() encounters a transient
  // network failure on Vercel cold starts.
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-")
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
