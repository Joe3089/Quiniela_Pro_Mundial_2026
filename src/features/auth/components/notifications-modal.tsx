"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Trophy, Star, Info, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { TOURNAMENT_ID } from "@/constants";

interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

function typeIcon(type: string) {
  if (type === "ranking_update") return <Trophy className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />;
  if (type === "prediction_scored") return <Star className="h-3.5 w-3.5 text-emerald-400" />;
  return <Info className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />;
}

function channelBadge(channel: string) {
  if (channel === "email") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">Email</span>;
  if (channel === "whatsapp") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">WhatsApp</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-muted-foreground border border-white/10">App</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Justo ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const supabase = createClient() as any;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("tournament_id", TOURNAMENT_ID)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: Notification[] | null }) => {
        setNotifications(data ?? []);
        setLoading(false);
      });
  }, [open, user]);

  const markAllRead = async () => {
    if (!user) return;
    const supabase = createClient() as any;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const supabase = createClient() as any;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-md mx-auto"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "hsl(222 28% 6% / 0.98)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center">
                    <Bell className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Notificaciones</h2>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))] text-white min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Marcar leídas
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-muted-foreground hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[420px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin notificaciones aún</p>
                    <p className="text-xs text-muted-foreground/60 text-center max-w-[220px]">
                      Recibirás notificaciones cuando finalicen partidos y se actualice el ranking.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/4",
                          !n.is_read && "bg-[hsl(var(--primary)/0.04)]"
                        )}
                      >
                        <div className={cn(
                          "mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                          !n.is_read ? "bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.2)]" : "bg-white/5 border border-white/8"
                        )}>
                          {typeIcon(n.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-xs font-semibold leading-tight",
                              n.is_read ? "text-white/70" : "text-white"
                            )}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {n.body}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {channelBadge(n.channel)}
                            <span className="text-[10px] text-muted-foreground/60">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/8">
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Las notificaciones se envían por App, Email y WhatsApp cuando finaliza un partido.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
