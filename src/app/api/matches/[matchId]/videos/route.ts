import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createClient();

  // Fetch match status first
  const { data: match } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single();

  const status = match?.status ?? "scheduled";

  const { data } = await supabase
    .from("match_videos")
    .select("id, match_id, youtube_video_id, title, type, thumbnail_url, published_at, channel_source, channel_priority, duration_seconds")
    .eq("match_id", matchId)
    .order("channel_priority", { ascending: true })
    .order("published_at", { ascending: false });

  const videos = data ?? [];

  // Filter by match status:
  // - finished: ONLY highlights (never show preview for finished matches)
  // - live: show highlights if available, else preview
  // - scheduled/upcoming: ONLY preview
  let filtered: typeof videos;

  if (status === "finished") {
    filtered = videos.filter((v) => v.type === "highlights");
  } else if (status === "live") {
    const highlights = videos.filter((v) => v.type === "highlights");
    filtered = highlights.length > 0 ? highlights : videos.filter((v) => v.type === "preview");
  } else {
    // scheduled / upcoming / postponed
    filtered = videos.filter((v) => v.type === "preview");
  }

  // Smart dedup: keep one "full" highlight + one "penalties" highlight + one preview
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isPenaltiesVideo = (v: any) => {
    const t = (v.title ?? "").toLowerCase();
    return t.includes("tanda") || t.includes("penalty") || t.includes("penalties") || t.includes("penales") || t.includes("shootout");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestFull: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestPen: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestPreview: any = null;

  for (const v of filtered) {
    if (v.type === "preview" && !bestPreview) { bestPreview = v; continue; }
    if (v.type === "highlights") {
      if (isPenaltiesVideo(v) && !bestPen) { bestPen = v; continue; }
      if (!isPenaltiesVideo(v) && !bestFull) { bestFull = v; continue; }
    }
  }

  // Order: full highlights → penalties → preview
  const result = [bestFull, bestPen, bestPreview].filter(Boolean);

  return NextResponse.json(result);
}
