import { NextResponse } from "next/server";
import { getLiveFixtures } from "@/services/api-football";
import { createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYNC_COOLDOWN_S = 120;

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://quiniela-pro-mundial-2026.vercel.app";
}

export async function GET() {
  try {
    const fixtures = await getLiveFixtures();
    const liveApiIds = new Set((fixtures ?? []).map((f) => f.fixture.id));

    checkAndSync(liveApiIds).catch(() => {});

    return NextResponse.json(fixtures ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function checkAndSync(liveApiIds: Set<number>) {
  try {
    const supabase = await createAdminClient();

    const { data: dbLive } = await supabase
      .from("matches")
      .select("id, api_football_fixture_id, updated_at")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("status", "live")
      .not("api_football_fixture_id", "is", null);

    if (!dbLive || dbLive.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const justFinished = dbLive.filter((m: any) => !liveApiIds.has(m.api_football_fixture_id));
    if (justFinished.length === 0) return;

    const now = new Date();
    // Check cooldown against the just-finished matches specifically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentSync = justFinished.some((m: any) => {
      const updatedAt = new Date(m.updated_at);
      return now.getTime() - updatedAt.getTime() < SYNC_COOLDOWN_S * 1000;
    });
    if (recentSync) return;

    await fetch(`${getBaseUrl()}/api/football/sync?action=scores`, {
      headers: { "user-agent": "vercel-cron/1.0" },
      signal: AbortSignal.timeout(55_000),
    });
  } catch { /* non-fatal */ }
}
