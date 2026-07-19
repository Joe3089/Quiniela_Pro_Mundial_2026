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
  // These requests carry the Next-Router-State-Tree header, and the app often
  // fires several of them concurrently (prefetch on hover/viewport). During
  // such navigations the client already owns the Supabase auth state via the
  // Zustand store, so we skip auth entirely here — both the redirect logic
  // AND the getSession() refresh call. Calling getSession() (which refreshes
  // the access token when expired) from many concurrent RSC requests races
  // multiple refreshes against the same single-use refresh_token cookie,
  // which throws "Invalid Refresh Token: Already Used" and can leave the
  // losing request's tab stuck with a dead session. Only full-page
  // navigations — far less frequent, so no meaningful race — refresh here;
  // the browser Supabase client independently handles proactive refresh too.
  const isRSCNavigation =
    request.headers.get("rsc") === "1" ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-url");

  if (isRSCNavigation) {
    return supabaseResponse;
  }

  // Attempt to get session so that token-refresh cookies are written back.
  let user = null;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  } catch {
    // Network/timeout, or a concurrent request already rotated the refresh
    // token — fall through to cookie check below rather than erroring.
  }

  const protectedRoutes = ["/dashboard", "/fixtures", "/predictions", "/rankings", "/selecciones", "/estadisticas", "/profile", "/admin", "/en-vivo", "/noticias"];
  const authRoutes = ["/auth/login", "/auth/register"];
  const pathname = request.nextUrl.pathname;

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

  return supabaseResponse;
}
