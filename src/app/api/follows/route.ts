import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

/**
 * GET /api/follows?profile_id=<uuid>
 *   → { follows, followed_by, followers_count, following_count }
 */
export async function GET(req: NextRequest) {
  const serverSupa = await createServerClient();
  const { data: { user } } = await serverSupa.auth.getUser();

  const profileId = req.nextUrl.searchParams.get("profile_id");
  if (!profileId) return NextResponse.json({ follows: false, followed_by: false, followers_count: 0, following_count: 0 });

  const db = admin();
  try {
    const [
      { count: followersCount },
      { count: followingCount },
      { data: followsRow },
      { data: followedByRow },
    ] = await Promise.all([
      db.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
      db.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      user
        ? db.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", profileId).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? db.from("user_follows").select("id").eq("follower_id", profileId).eq("following_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      follows: !!followsRow,
      followed_by: !!followedByRow,
      followers_count: followersCount ?? 0,
      following_count: followingCount ?? 0,
    });
  } catch {
    return NextResponse.json({ follows: false, followed_by: false, followers_count: 0, following_count: 0 });
  }
}

/** POST /api/follows  — toggle follow (body: { following_id }) */
export async function POST(req: NextRequest) {
  const serverSupa = await createServerClient();
  const { data: { user }, error: authErr } = await serverSupa.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { following_id } = await req.json().catch(() => ({}));
  if (!following_id || following_id === user.id)
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const db = admin();
  try {
    const { data: existing } = await db
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", following_id)
      .maybeSingle();

    if (existing) {
      await db.from("user_follows").delete().eq("id", existing.id);
      return NextResponse.json({ follows: false });
    } else {
      await db.from("user_follows").insert({ follower_id: user.id, following_id });
      return NextResponse.json({ follows: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json({ error: "table_missing", follows: false }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
