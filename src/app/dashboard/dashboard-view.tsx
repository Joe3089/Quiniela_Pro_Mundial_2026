"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Target, BarChart3, Calendar, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useUserRank } from "@/features/rankings/hooks/use-rankings";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { SCORING } from "@/constants";

export function DashboardView() {
  const { user } = useAuthStore();
  const { data: userRank, isLoading: rankLoading } = useUserRank();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();
  const { data: upcomingMatches, isLoading: matchesLoading } = useMatches();

  const nextMatches = upcomingMatches
    ?.filter((m) => m.status === "scheduled")
    .slice(0, 3) ?? [];

  const pendingPredictions = nextMatches.filter(
    (m) => !predictions?.find((p) => p.match_id === m.id)
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-1">
          Hola, <span className="text-gradient">{user?.display_name ?? user?.username}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm">Mundial FIFA 2026</p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Posición",
            value: rankLoading ? null : userRank?.rank_position ? `#${userRank.rank_position}` : "—",
            icon: Trophy,
            color: "text-yellow-400",
          },
          {
            label: "Puntos",
            value: rankLoading ? null : userRank?.total_points ?? 0,
            icon: TrendingUp,
            color: "text-primary",
          },
          {
            label: "Exactos",
            value: rankLoading ? null : userRank?.exact_scores ?? 0,
            icon: Zap,
            color: "text-accent",
          },
          {
            label: "Predicciones",
            value: predsLoading ? null : predictions?.length ?? 0,
            icon: Target,
            color: "text-orange-400",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl border border-border/40 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            {stat.value === null ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Alert: pending predictions */}
      {pendingPredictions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                Tienes {pendingPredictions} partido{pendingPredictions > 1 ? "s" : ""} sin predecir
              </p>
              <p className="text-xs text-muted-foreground">¡No pierdas puntos!</p>
            </div>
          </div>
          <Button variant="gradient" size="sm" asChild>
            <Link href="/predictions">Predecir</Link>
          </Button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Next matches */}
        <Card className="glass border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Próximos partidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matchesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))
              : nextMatches.map((match) => (
                  <Link key={match.id} href={`/predictions?match=${match.id}`}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{match.home_team?.short_name ?? "TBD"}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">{match.away_team?.short_name ?? "TBD"}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {match.group?.letter ? `Grupo ${match.group.letter}` : match.phase}
                      </Badge>
                    </div>
                  </Link>
                ))}
            {!matchesLoading && nextMatches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay partidos próximos
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scoring guide */}
        <Card className="glass border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Sistema de puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { pts: SCORING.EXACT_SCORE, label: "Marcador exacto", color: "text-primary" },
                { pts: SCORING.CORRECT_WINNER, label: "Ganador correcto", color: "text-accent" },
                { pts: SCORING.EXACT_DRAW, label: "Empate exacto", color: "text-yellow-400" },
                { pts: SCORING.PARTIAL_DRAW, label: "Empate (resultado)", color: "text-orange-400" },
                { pts: SCORING.WRONG, label: "Predicción errónea", color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.pts} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
