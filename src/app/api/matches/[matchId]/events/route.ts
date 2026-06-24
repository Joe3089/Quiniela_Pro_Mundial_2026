import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("match_events")
    .select("id, type, player_name, minute, minute_extra, assist_name, team_id")
    .eq("match_id", matchId)
    .order("minute", { ascending: true })
    .order("minute_extra", { ascending: true });

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
