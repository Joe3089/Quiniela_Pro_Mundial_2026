import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Verify session via server client (reads cookies)
  const serverSupa = await createServerClient();
  const { data: { user }, error: authErr } = await serverSupa.auth.getUser();
  if (authErr || !user) {
    console.error("[avatar] auth error:", authErr?.message);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Máximo 2 MB" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  // Use service-role client directly (no SSR cookies needed for admin ops)
  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: upErr } = await adminSupa.storage
    .from("avatars")
    .upload(path, bytes, { upsert: true, contentType: file.type });

  if (upErr) {
    console.error("[avatar] upload error:", upErr.message);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: { publicUrl } } = adminSupa.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?t=${Date.now()}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (adminSupa as any).from("users").update({ avatar_url: url }).eq("id", user.id);
  if (dbErr) {
    console.error("[avatar] db error:", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ url });
}
