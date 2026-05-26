"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lock, CheckCircle2, Clock, Users, X, Star, Shirt } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/features/fixtures/components/match-card";
import { PredictionForm } from "@/features/predictions/components/prediction-form";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { getTeamByCode, type WCTeam, type WCPlayer } from "@/data/wc2026-teams";
import type { Match } from "@/types/fixtures";
import { cn } from "@/lib/utils";

/* ── 11 Titular Modal ─────────────────────────────────────── */
const positionColors = {
  GK:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DEF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MID: "bg-green-500/20 text-green-400 border-green-500/30",
  FWD: "bg-red-500/20 text-red-400 border-red-500/30",
};

function LineupModal({
  homeTeam,
  awayTeam,
  onClose,
}: {
  homeTeam: WCTeam | undefined;
  awayTeam: WCTeam | undefined;
  onClose: () => void;
}) {
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
  const team = activeTeam === "home" ? homeTeam : awayTeam;

  if (!homeTeam && !awayTeam) return null;

  const players = team?.players ?? [];
  const gk  = players.filter(p => p.position === "GK");
  const def = players.filter(p => p.position === "DEF");
  const mid = players.filter(p => p.position === "MID");
  const fwd = players.filter(p => p.position === "FWD");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full md:max-w-2xl bg-[hsl(var(--card))] rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sm">XI Titular</h2>
            <p className="text-[11px] text-muted-foreground">Formación y convocatoria</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Team switcher */}
        <div className="flex gap-2 p-3 border-b border-white/5 shrink-0">
          {homeTeam && (
            <button
              onClick={() => setActiveTeam("home")}
              className={cn(
                "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all",
                activeTeam === "home"
                  ? "bg-[hsl(var(--brand-blue)/0.2)] border-[hsl(var(--brand-blue)/0.4)] text-white"
                  : "glass border-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <span className="text-xl leading-none">{homeTeam.flag}</span>
              <span className="truncate">{homeTeam.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{homeTeam.formation}</span>
            </button>
          )}
          {awayTeam && (
            <button
              onClick={() => setActiveTeam("away")}
              className={cn(
                "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all",
                activeTeam === "away"
                  ? "bg-[hsl(var(--brand-blue)/0.2)] border-[hsl(var(--brand-blue)/0.4)] text-white"
                  : "glass border-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <span className="text-xl leading-none">{awayTeam.flag}</span>
              <span className="truncate">{awayTeam.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{awayTeam.formation}</span>
            </button>
          )}
        </div>

        {!team ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Datos no disponibles para esta selección
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Field visualization */}
            <div className="relative mx-4 my-3 rounded-xl overflow-hidden" style={{ height: 220 }}>
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(180deg, #15803d 0%, #166534 50%, #15803d 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-28 h-16 border border-white/20 rounded-sm" />
                <div className="w-full border-t border-white/20 absolute top-1/2" />
                <div className="w-14 h-14 border border-white/20 rounded-full absolute top-1/2 -translate-y-1/2" />
              </div>
              <div className="absolute inset-2 flex flex-col justify-between p-1.5">
                {[
                  team.xi.slice(0, 1),
                  team.xi.slice(1, 5),
                  team.xi.slice(5, 8),
                  team.xi.slice(8, 11),
                ].map((row, ri) => (
                  <div key={ri} className="flex justify-around items-center">
                    {row.map((name, ni) => (
                      <div key={ni} className="flex flex-col items-center gap-0.5">
                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--brand-blue))] border-2 border-white/30 flex items-center justify-center">
                          <span className="text-[6px] font-black text-white">
                            {ri === 0 ? "GK" : ri === 1 ? "DEF" : ri === 2 ? "MID" : "FWD"}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-white bg-black/50 rounded px-0.5 max-w-[48px] truncate text-center">{name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Player list */}
            {[
              { label: "Porteros", players: gk, pos: "GK" as const },
              { label: "Defensas", players: def, pos: "DEF" as const },
              { label: "Mediocampistas", players: mid, pos: "MID" as const },
              { label: "Delanteros", players: fwd, pos: "FWD" as const },
            ].map(({ label, players: ps, pos }) =>
              ps.length > 0 ? (
                <div key={pos}>
                  <div className={cn("px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase border-y border-white/5", positionColors[pos])}>
                    {label}
                  </div>
                  {ps.map((player: WCPlayer) => (
                    <div key={player.name} className="flex items-center gap-3 px-4 py-2 hover:bg-white/2 transition-colors">
                      <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                          {player.isCaptain && (
                            <span className="text-[9px] font-bold px-1 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>
                          )}
                          {player.isKeyPlayer && (
                            <Star className="h-2.5 w-2.5 text-[hsl(var(--brand-gold))] fill-current shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{player.club}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{player.age}a</span>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Prediction Match Row ─────────────────────────────────── */
function PredictionMatchRow({
  match,
  prediction,
}: {
  match: Match;
  prediction?: { home: number; away: number } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [lineupOpen, setLineupOpen] = useState(false);
  const LOCKOUT_MS = 2 * 60 * 60 * 1000;
  const isLocked = match.status !== "scheduled" ||
    new Date(match.match_date).getTime() - Date.now() <= LOCKOUT_MS;

  const homeTeam = getTeamByCode(match.home_team?.fifa_code ?? "");
  const awayTeam = getTeamByCode(match.away_team?.fifa_code ?? "");

  return (
    <>
      <div className="glass rounded-xl border border-border/40 overflow-hidden">
        <div
          className={cn("cursor-pointer", !isLocked && "hover:bg-muted/10 transition-colors")}
          onClick={() => !isLocked && setExpanded(!expanded)}
        >
          <MatchCard
            match={match}
            showPrediction={!!prediction}
            prediction={prediction}
            compact
          />
          <div className="px-4 pb-3 flex items-center justify-between gap-2">
            {isLocked ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Predicciones cerradas
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Toca para predecir</span>
            )}
            {(homeTeam || awayTeam) && (
              <button
                onClick={(e) => { e.stopPropagation(); setLineupOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Users className="h-3 w-3" />
                11 Titular
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && !isLocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/30 overflow-hidden"
            >
              <div className="p-4">
                <PredictionForm
                  match={match}
                  existingPrediction={null}
                  onSuccess={() => setExpanded(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lineupOpen && (
          <LineupModal
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            onClose={() => setLineupOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main View ────────────────────────────────────────────── */
export function PredictionsView() {
  const { data: allMatches, isLoading: matchesLoading } = useMatches();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();

  const predictionMap = new Map(
    predictions?.map((p) => [
      p.match_id,
      { home: p.home_score_prediction, away: p.away_score_prediction },
    ])
  );

  const open = allMatches?.filter((m) => m.status === "scheduled") ?? [];
  const withPrediction = allMatches?.filter((m) => predictionMap.has(m.id)) ?? [];
  const finished = allMatches?.filter((m) => m.status === "finished") ?? [];
  const isLoading = matchesLoading || predsLoading;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
            <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
          Mis <span className="text-gradient-vivid ml-1">Predicciones</span>
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{predictions?.length ?? 0} guardadas</Badge>
          {open.length > 0 && (
            <Badge variant="warning">{open.filter((m) => !predictionMap.has(m.id)).length} pendientes</Badge>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="open">
        <TabsList className="mb-4 glass border border-border/30">
          <TabsTrigger value="open" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Abiertas ({open.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Guardadas ({withPrediction.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Finalizadas ({finished.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : open.length > 0 ? (
            <div className="space-y-2">
              {open.map((match) => (
                <PredictionMatchRow
                  key={match.id}
                  match={match}
                  prediction={predictionMap.get(match.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No hay partidos abiertos para predecir</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <div className="space-y-2">
            {withPrediction.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showPrediction
                prediction={predictionMap.get(match.id)}
              />
            ))}
            {withPrediction.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Aún no tienes predicciones guardadas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished">
          <div className="space-y-2">
            {finished.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {finished.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay partidos finalizados aún</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
