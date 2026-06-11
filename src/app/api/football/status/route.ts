import { NextResponse } from "next/server";
import { getApiStatus } from "@/services/api-football";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Only admins can check API status
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const status = await getApiStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
