"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Trophy, Target, Star, LogOut, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useUserRank } from "@/features/rankings/hooks/use-rankings";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function ProfileView() {
  const { user, setUser } = useAuthStore();
  const { data: rank } = useUserRank();
  const { data: predictions } = useUserPredictions();
  const logout = useLogout();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Máximo 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("users").update({ avatar_url: urlWithCache }).eq("id", user.id);
      setUser({ ...user, avatar_url: urlWithCache });
      setAvatarPreview(urlWithCache);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Error al subir");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  const accuracy = predictions
    ? Math.round(
        ((predictions.filter((p) => p.points_earned && p.points_earned > 0).length /
          Math.max(predictions.filter((p) => p.status !== "pending").length, 1)) *
          100)
      )
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-border/40 p-6 flex items-center gap-5"
      >
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview ?? user.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl font-bold">
              {getInitials(user.display_name ?? user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {avatarUploading ? (
              <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {user.display_name ?? user.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
          {user.is_admin && (
            <Badge variant="gold" className="mt-2">Admin</Badge>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Posición", value: rank?.rank_position ? `#${rank.rank_position}` : "—", icon: Trophy, color: "text-yellow-400" },
          { label: "Puntos", value: rank?.total_points ?? 0, icon: Star, color: "text-primary" },
          { label: "Exactos", value: rank?.exact_scores ?? 0, icon: Target, color: "text-accent" },
          { label: "Precisión", value: `${accuracy}%`, icon: User, color: "text-orange-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl border border-border/30 p-4 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Prediction breakdown */}
      {rank && (
        <Card className="glass border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desglose de predicciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Marcadores exactos", value: rank.exact_scores, pts: 5, color: "text-primary" },
              { label: "Ganadores correctos", value: rank.correct_winners, pts: 3, color: "text-accent" },
              { label: "Empates exactos", value: rank.exact_draws, pts: 2, color: "text-yellow-400" },
              { label: "Empates parciales", value: rank.partial_draws, pts: 1, color: "text-orange-400" },
              { label: "Incorrectas", value: rank.wrong_predictions, pts: 0, color: "text-destructive" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${row.color}`}>{row.pts} pts</span>
                  <span className="text-sm">{row.label}</span>
                </div>
                <Badge variant="secondary">{row.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => logout.mutate()}
        loading={logout.isPending}
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}
