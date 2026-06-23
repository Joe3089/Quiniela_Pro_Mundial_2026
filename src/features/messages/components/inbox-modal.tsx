"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { getInitials, cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChatModal } from "./chat-modal";

interface ConvSummary {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  receiver?: { id: string; username: string; display_name: string | null; avatar_url: string | null };
}

export function InboxModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const [chatPeer, setChatPeer] = useState<{ id: string; username: string; display_name: string | null; avatar_url: string | null } | null>(null);

  const { data: convs = [], isLoading } = useQuery<ConvSummary[]>({
    queryKey: ["messages", "inbox"],
    queryFn: async () => {
      const res = await fetch("/api/messages?inbox=1");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const unreadCount = convs.filter(c => !c.is_read && c.receiver_id === user?.id).length;

  if (chatPeer) {
    return (
      <AnimatePresence>
        <ChatModal peer={chatPeer} onClose={() => setChatPeer(null)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 w-full sm:max-w-sm glass-strong border border-border/40 shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-bold text-sm">Mensajes</p>
            {unreadCount > 0 && <p className="text-[10px] text-primary">{unreadCount} sin leer</p>}
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 56px)" }}>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No tienes mensajes aún</p>
            </div>
          ) : (
            convs.map((conv) => {
              const isMe = conv.sender_id === user?.id;
              const peer = isMe ? conv.receiver : conv.sender;
              if (!peer) return null;
              const peerName = peer.display_name ?? peer.username;
              const unread = !conv.is_read && conv.receiver_id === user?.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setChatPeer(peer)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-border/20 text-left"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={peer.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(peerName)}</AvatarFallback>
                    </Avatar>
                    {unread && (
                      <Circle className="absolute -top-0.5 -right-0.5 h-3 w-3 fill-primary text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", unread && "text-white")}>{peerName}</p>
                    <p className={cn("text-xs truncate", unread ? "text-foreground/80" : "text-muted-foreground")}>
                      {isMe ? "Tú: " : ""}{conv.content}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(conv.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
