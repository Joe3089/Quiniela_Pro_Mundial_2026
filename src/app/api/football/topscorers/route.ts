import { NextRequest, NextResponse } from "next/server";
import { getTopScorers, getTopAssists, getTopYellowCards } from "@/services/api-football";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "scorers";
  try {
    let data;
    if (type === "assists") data = await getTopAssists();
    else if (type === "yellows") data = await getTopYellowCards();
    else data = await getTopScorers();

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=30" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
