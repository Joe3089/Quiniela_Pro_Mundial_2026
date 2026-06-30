import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("match_videos")
    .select("*")
    .eq("match_id", matchId)
    .order("published_at", { ascending: false });

  // Deduplicate by type — prefer most recent per type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byType: Record<string, any> = {};
  for (const v of data ?? []) {
    if (!byType[v.type]) byType[v.type] = v;
  }

  // Return highlights first, then preview
  const result = [byType["highlights"], byType["preview"]].filter(Boolean);

  return NextResponse.json(result);
}
