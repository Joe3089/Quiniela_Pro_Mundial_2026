import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Exclude: static assets, auth callback (proxy must not interfere with
    // the OAuth code exchange — it can fire SIGNED_OUT and delete the very
    // cookies the callback just wrote), and common public files.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
