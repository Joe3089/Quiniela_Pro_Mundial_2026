import { NextResponse } from "next/server";
import { createAdminClient, createClient as createServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";

// Read-only admin view of every post-tournament survey response, joined with the
// respondent so the panel can show/filter by user, date and rating.
export async function GET() {
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      `id, rating, improve, add_feature, remove_feature, would_recommend,
       recommend_reason, next_version_wishes, created_at,
       user:users!survey_responses_user_id_fkey(id, display_name, username, email, avatar_url)`
    )
    .eq("tournament_id", TOURNAMENT_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responses = (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    improve: r.improve,
    addFeature: r.add_feature,
    removeFeature: r.remove_feature,
    wouldRecommend: r.would_recommend,
    recommendReason: r.recommend_reason,
    nextVersionWishes: r.next_version_wishes,
    createdAt: r.created_at,
    userId: r.user?.id ?? null,
    userName: r.user?.display_name || r.user?.username || "—",
    userEmail: r.user?.email ?? null,
    avatarUrl: r.user?.avatar_url ?? null,
  }));

  const total = responses.length;
  const avgRating = total
    ? Math.round((responses.reduce((s, r) => s + (r.rating ?? 0), 0) / total) * 10) / 10
    : 0;
  const recommendYes = responses.filter((r) => r.wouldRecommend === true).length;

  return NextResponse.json(
    { responses, total, avgRating, recommendYes },
    { headers: { "Cache-Control": "no-store" } }
  );
}
