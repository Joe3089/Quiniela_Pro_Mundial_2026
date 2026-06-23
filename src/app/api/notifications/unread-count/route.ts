import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("is_read", false)
    .neq("type", "private_message");

  return NextResponse.json({ count: count ?? 0 });
}
