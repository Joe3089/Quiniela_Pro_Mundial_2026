"use client";

import { motion } from "framer-motion";
import { User, Trophy, Target, Star, LogOut } from "lucide-react";
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

export function ProfileView() {
  const { user } = useAuthStore();
  const { data: rank } = useUserRank();
  const { data: predictions } = useUserPredictions();
  const logout = useLogout();

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
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-2xl font-bold">
            {getInitials(user.display_name ?? user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {user.display_name ?? user.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
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
