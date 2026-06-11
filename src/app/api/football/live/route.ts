import { NextResponse } from "next/server";
import { getLiveFixtures } from "@/services/api-football";

// Public endpoint — live scores are visible to all users
export async function GET() {
  try {
    const fixtures = await getLiveFixtures();
    return NextResponse.json(fixtures, {
      headers: { "Cache-Control": "no-store" }, // never cache live data
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
