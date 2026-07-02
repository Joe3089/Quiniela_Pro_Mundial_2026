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

  // Next.js App Router fires a server fetch for every <Link> navigation (RSC).
  // These requests carry the Next-Router-State-Tree header. During such navigations
  // the client already owns the Supabase auth state via the Zustand store; a server
  // redirect here would overrule a perfectly valid client session and send the user
  // to /auth/login. We refresh cookies for RSC requests but skip route-protection
  // redirects — the client handles those gracefully.
  const isRSCNavigation =
    request.headers.get("rsc") === "1" ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-url");

  // Attempt to get session so that token-refresh cookies are written back.
  let user = null;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  } catch {
    // Network/timeout — fall through to cookie check below
  }

  const protectedRoutes = ["/dashboard", "/fixtures", "/predictions", "/rankings", "/selecciones", "/estadisticas", "/profile", "/admin", "/en-vivo", "/noticias"];
  const authRoutes = ["/auth/login", "/auth/register"];
  const pathname = request.nextUrl.pathname;

  // For RSC navigations the client is responsible for auth — skip redirects.
  // The client's auth store + RouteGuard handles protection for RSC navigations.
  if (!isRSCNavigation) {
    if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
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
  }

  return supabaseResponse;
}
