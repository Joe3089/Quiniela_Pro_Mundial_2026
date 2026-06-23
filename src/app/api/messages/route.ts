/**
 * Messages API — uses `notifications` table with type='private_message'
 * when `messages` table doesn't exist (graceful fallback).
 * Messages table migration: supabase/migrations/011_messages.sql
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

type RawMsg = {
  id: string; sender_id?: string; receiver_id?: string;
  content?: string; body?: string;
  is_read: boolean; read_at?: string | null; created_at: string;
  metadata?: { sender_id?: string; receiver_id?: string } | null;
  users?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

// Normalise a row from either table to a common shape
function normalise(row: RawMsg, currentUserId: string) {
  const senderId = row.sender_id ?? row.metadata?.sender_id ?? "";
  const receiverId = row.receiver_id ?? row.metadata?.receiver_id ?? "";
  const content = row.content ?? row.body ?? "";
  return { id: row.id, sender_id: senderId, receiver_id: receiverId, content, is_read: row.is_read, read_at: row.read_at ?? null, created_at: row.created_at };
}

async function useMessagesTable(db: ReturnType<typeof admin>) {
  const { error } = await db.from("messages").select("id").limit(0);
  return !error;
}

/** GET /api/messages?with=<uuid>  — conversation with a user */
/** GET /api/messages?inbox=1      — list conversations (latest per user) */
export async function GET(req: NextRequest) {
  const serverSupa = await createServerClient();
  const { data: { user }, error: authErr } = await serverSupa.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const withUser = req.nextUrl.searchParams.get("with");
  const inbox = req.nextUrl.searchParams.get("inbox");
  const db = admin();
  const hasTable = await useMessagesTable(db);

  try {
    if (withUser) {
      let msgs: RawMsg[] = [];

      if (hasTable) {
        const { data, error } = await db
          .from("messages")
          .select("*, sender:users!messages_sender_id_fkey(id, username, display_name, avatar_url)")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUser}),and(sender_id.eq.${withUser},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true })
          .limit(100);
        if (error) throw error;
        msgs = data ?? [];
        // Mark as read
        await db.from("messages").update({ is_read: true, read_at: new Date().toISOString() })
          .eq("receiver_id", user.id).eq("sender_id", withUser).eq("is_read", false);
      } else {
        // Fallback: use notifications table
        // Messages I received from peer
        const { data: received } = await db
          .from("notifications")
          .select("*")
          .eq("type", "private_message")
          .eq("user_id", user.id)
          .eq("metadata->>sender_id", withUser)
          .order("created_at", { ascending: true }).limit(50);
        // Messages I sent to peer (stored as notification to peer)
        const { data: sent } = await db
          .from("notifications")
          .select("*")
          .eq("type", "private_message")
          .eq("user_id", withUser)
          .eq("metadata->>sender_id", user.id)
          .order("created_at", { ascending: true }).limit(50);

        msgs = [...(received ?? []), ...(sent ?? [])].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        // Mark as read
        await db.from("notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("type", "private_message")
          .eq("user_id", user.id)
          .eq("metadata->>sender_id", withUser)
          .eq("is_read", false);
      }

      return NextResponse.json(msgs.map((m) => normalise(m, user.id)));
    }

    if (inbox) {
      let msgs: RawMsg[] = [];

      if (hasTable) {
        const { data, error } = await db
          .from("messages")
          .select("*, sender:users!messages_sender_id_fkey(id, username, display_name, avatar_url), receiver:users!messages_receiver_id_fkey(id, username, display_name, avatar_url)")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        msgs = data ?? [];
      } else {
        // Fallback: notifications I received + sent
        const { data: received } = await db
          .from("notifications")
          .select("*, users!notifications_user_id_fkey(id,username,display_name,avatar_url)")
          .eq("type", "private_message")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(100);
        const { data: sent } = await db
          .from("notifications")
          .select("*, users!notifications_user_id_fkey(id,username,display_name,avatar_url)")
          .eq("type", "private_message")
          .eq("metadata->>sender_id", user.id)
          .order("created_at", { ascending: false }).limit(100);
        msgs = [...(received ?? []), ...(sent ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      // Group by conversation partner, keep only latest
      const seen = new Map<string, ReturnType<typeof normalise> & {
        sender?: RawMsg["users"]; receiver?: RawMsg["users"];
      }>();
      for (const row of msgs) {
        const norm = normalise(row, user.id);
        const partner = norm.sender_id === user.id ? norm.receiver_id : norm.sender_id;
        if (!seen.has(partner)) {
          seen.set(partner, { ...norm, sender: (row as any).sender ?? null, receiver: (row as any).receiver ?? null });
        }
      }

      return NextResponse.json(Array.from(seen.values()));
    }

    return NextResponse.json([]);
  } catch (err: unknown) {
    console.error("[messages]", err);
    return NextResponse.json([], { status: 200 });
  }
}

/** POST /api/messages  — send a message { receiver_id, content } */
export async function POST(req: NextRequest) {
  const serverSupa = await createServerClient();
  const { data: { user }, error: authErr } = await serverSupa.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { receiver_id, content } = await req.json().catch(() => ({}));
  if (!receiver_id || !content?.trim()) return NextResponse.json({ error: "receiver_id y content requeridos" }, { status: 400 });
  if (receiver_id === user.id) return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
  if (content.trim().length > 2000) return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });

  const db = admin();
  const hasTable = await useMessagesTable(db);

  try {
    if (hasTable) {
      const { data, error } = await db
        .from("messages")
        .insert({ sender_id: user.id, receiver_id, content: content.trim() })
        .select().single();
      if (error) throw error;
      return NextResponse.json(normalise(data, user.id));
    }

    // Fallback: use notifications table
    const senderRow = await db.from("users").select("display_name, username").eq("id", user.id).single();
    const senderName = senderRow.data?.display_name ?? senderRow.data?.username ?? "Usuario";

    const { data, error } = await db
      .from("notifications")
      .insert({
        user_id: receiver_id,
        type: "private_message",
        channel: "app",
        title: `Mensaje de ${senderName}`,
        body: content.trim(),
        metadata: { sender_id: user.id, receiver_id },
        status: "sent",
      })
      .select().single();
    if (error) throw error;
    return NextResponse.json(normalise(data, user.id));
  } catch (err: unknown) {
    console.error("[messages POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
