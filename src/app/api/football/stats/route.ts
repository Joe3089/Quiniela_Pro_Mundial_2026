import { NextRequest, NextResponse } from "next/server";
import { getFixtureStats } from "@/services/api-football";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Missing or invalid fixture id" }, { status: 400 });
  }

  try {
    const stats = await getFixtureStats(Number(id));
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
