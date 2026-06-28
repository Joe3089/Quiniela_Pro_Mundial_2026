import { NextResponse } from "next/server";
import { createAdminClient, createClient as createServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  // Verify admin
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch upcoming matches — filter status in JS to avoid enum cast issue
  const { data: matchData } = await supabase
    .from("matches")
    .select(`id, match_date, phase, status,
      home_team:teams!matches_home_team_id_fkey(fifa_code),
      away_team:teams!matches_away_team_id_fkey(fifa_code)`)
    .eq("tournament_id", TOURNAMENT_ID)
    .gte("match_date", new Date().toISOString())
    .order("match_date", { ascending: true })
    .limit(50);
  const filteredMatchData = (matchData ?? []).filter((m: any) => m.status === "scheduled");

  const ids = filteredMatchData.map((m: any) => m.id);

  const { data: predData } = ids.length
    ? await supabase
        .from("predictions")
        .select(`match_id, home_score_prediction, away_score_prediction, outcome_prediction, updated_at,
          user:users!predictions_user_id_fkey(username, display_name)`)
        .in("match_id", ids)
    : { data: [] };

  // Group predictions by match
  const byMatch: Record<string, any[]> = {};
  for (const p of (predData ?? [])) {
    if (!byMatch[p.match_id]) byMatch[p.match_id] = [];
    byMatch[p.match_id].push(p);
  }

  const result = filteredMatchData.map((m: any) => ({
    id: m.id,
    match_date: m.match_date,
    phase: m.phase,
    home_code: m.home_team?.fifa_code ?? "?",
    away_code: m.away_team?.fifa_code ?? "?",
    preds: (byMatch[m.id] ?? []).map((p: any) => ({
      name: p.user?.display_name || p.user?.username || "—",
      home: p.home_score_prediction,
      away: p.away_score_prediction,
      outcome: p.outcome_prediction ?? null,
      updated_at: p.updated_at,
    })),
  }));

  return NextResponse.json(result);
}
