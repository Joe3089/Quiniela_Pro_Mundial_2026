"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { getInitials, cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; username: string; display_name: string | null; avatar_url: string | null };
}

interface Peer {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function ChatModal({ peer, onClose }: { peer: Peer; onClose: () => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages", "conv", peer.id],
    queryFn: async () => {
      const res = await fetch(`/api/messages?with=${peer.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5_000,
    staleTime: 3_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: peer.id, content }),
      });
      if (!res.ok) throw new Error("Error enviando mensaje");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t || sendMutation.isPending) return;
    sendMutation.mutate(t);
  }, [text, sendMutation]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const peerName = peer.display_name ?? peer.username;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 w-full sm:max-w-md glass-strong border border-border/40 shadow-2xl flex flex-col rounded-t-2xl sm:rounded-2xl"
        style={{ height: "min(90vh, 580px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={peer.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(peerName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{peerName}</p>
            <p className="text-[10px] text-muted-foreground">@{peer.username}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground text-sm">Cargando...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Inicia la conversación con {peerName}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words",
                      isMe
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white/10 text-foreground rounded-bl-sm"
                    )}
                  >
                    <p>{msg.content}</p>
                    <p className={cn("text-[10px] mt-0.5", isMe ? "text-white/60 text-right" : "text-muted-foreground")}>
                      {new Date(msg.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-3 py-3 border-t border-border/30 flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribe un mensaje..."
            maxLength={2000}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-40 transition-all hover:bg-primary/80 shrink-0"
          >
            {sendMutation.isPending
              ? <span className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}
