/**
 * POST /api/notify
 * Called by the admin panel or Supabase webhook when a match finishes.
 * Sends email + WhatsApp notifications to configured recipients.
 *
 * Body: { matchId: string } | { manual: true, homeTeam, awayTeam, homeScore, awayScore }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyMatchFinished } from "@/services/notifications";

export async function POST(request: NextRequest) {
  // Validate caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));

  let matchData: Parameters<typeof notifyMatchFinished>[0];

  if (body.matchId) {
    // Fetch match data from DB
    const { data: match } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
      .eq("id", body.matchId)
      .single();

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // Fetch top 5 rankings
    const { data: rankings } = await supabase
      .from("rankings")
      .select("rank_position, total_points, user:users(display_name, username)")
      .order("rank_position", { ascending: true })
      .limit(5);

    matchData = {
      homeTeam: (match.home_team as any)?.name ?? "Local",
      awayTeam: (match.away_team as any)?.name ?? "Visitante",
      homeScore: match.home_score ?? 0,
      awayScore: match.away_score ?? 0,
      matchDate: match.match_date,
      venue: match.venue ?? match.city,
      rankingUpdated: true,
      topRanking: rankings?.map((r: any) => ({
        position: r.rank_position,
        displayName: r.user?.display_name ?? r.user?.username ?? "Usuario",
        points: r.total_points,
      })),
    };
  } else if (body.manual) {
    // Manual test notification
    matchData = {
      homeTeam: body.homeTeam ?? "México",
      awayTeam: body.awayTeam ?? "Sudáfrica",
      homeScore: body.homeScore ?? 2,
      awayScore: body.awayScore ?? 0,
      matchDate: new Date().toISOString(),
      venue: body.venue,
      rankingUpdated: body.rankingUpdated ?? false,
    };
  } else {
    return NextResponse.json({ error: "Provide matchId or manual=true" }, { status: 400 });
  }

  const result = await notifyMatchFinished(matchData);
  return NextResponse.json({ ok: true, ...result });
}
