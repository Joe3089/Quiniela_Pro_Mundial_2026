"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lock, CheckCircle2, Clock, Users, Star, ChevronDown, Goal, AlertTriangle, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/features/fixtures/components/match-card";
import { PredictionForm } from "@/features/predictions/components/prediction-form";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import type { Match } from "@/types/fixtures";
import { cn } from "@/lib/utils";

/* ── Countdown ────────────────────────────────────────────── */
function useCountdown(matchDate: string) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const LOCKOUT_MS = 0;
  const matchTime = new Date(matchDate).getTime();
  const ms = matchTime - now;
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const isLocking = ms > 0 && ms <= LOCKOUT_MS;
  const isWarning = ms > LOCKOUT_MS && ms <= 24 * 60 * 60 * 1000;

  let label = "";
  if (ms <= 0) {
    label = "En curso o finalizado";
  } else if (isLocking) {
    label = minutes <= 0 ? "¡Cierra en minutos!" : `¡Solo ${minutes} min para predecir!`;
  } else if (hours < 24) {
    label = hours > 0 ? `${hours}h ${minutes}m para predecir` : `${minutes} min para predecir`;
  } else {
    const days = Math.floor(hours / 24);
    label = `${days} día${days !== 1 ? "s" : ""} para predecir`;
  }

  return { ms, hours, minutes, isLocking, isWarning, isLocked: ms <= LOCKOUT_MS, label };
}

function CountdownBadge({ matchDate, hasPrediction }: { matchDate: string; hasPrediction: boolean }) {
  const { ms, isLocking, isWarning, isLocked, label } = useCountdown(matchDate);
  if (ms <= 0) return null;
  if (isLocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-3 mb-2 rounded-xl px-3 py-2 flex items-center gap-2 border text-xs font-semibold",
        isLocking
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : isWarning
            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            : "bg-[hsl(var(--brand-blue)/0.08)] border-[hsl(var(--brand-blue)/0.2)] text-[hsl(var(--brand-blue-light))]"
      )}
    >
      {isLocking ? (
        <Star className="h-3.5 w-3.5 shrink-0 animate-pulse" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="flex-1">{label}</span>
      {!hasPrediction && !isLocking && (
        <span className="text-[10px] opacity-70 shrink-0">¡Predice ahora!</span>
      )}
      {!hasPrediction && isLocking && (
        <span className="text-[10px] font-black animate-pulse shrink-0">⚠️ ¡ÚLTIMO MOMENTO!</span>
      )}
      {hasPrediction && (
        <span className="text-[10px] text-emerald-400 shrink-0">✓ Predicción guardada</span>
      )}
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
  const { isLocked, isLocking } = useCountdown(match.match_date);
  const locked = match.status !== "scheduled" || isLocked;
  const homeCode = match.home_team?.fifa_code;
  const awayCode = match.away_team?.fifa_code;

  return (
    <div className={cn(
      "glass rounded-xl border overflow-hidden transition-all",
      isLocking && !locked ? "border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-border/40"
    )}>
      {!locked && (
        <CountdownBadge matchDate={match.match_date} hasPrediction={!!prediction} />
      )}
      <div
        className={cn("cursor-pointer", !locked && "hover:bg-muted/10 transition-colors")}
        onClick={() => !locked && setExpanded(!expanded)}
      >
        <MatchCard
          match={match}
          showPrediction={!!prediction}
          prediction={prediction}
          compact
        />
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          {locked ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {match.status !== "scheduled" ? "Partido en curso / finalizado" : "Predicciones cerradas (2h antes del partido)"}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {expanded ? "Toca para cerrar" : "Toca para predecir"}
            </span>
          )}
          {(homeCode || awayCode) && (
            <div className="flex items-center gap-1">
              {homeCode && (
                <Link
                  href={`/selecciones/${homeCode}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <Users className="h-3 w-3" />
                  XI {homeCode}
                </Link>
              )}
              {awayCode && (
                <Link
                  href={`/selecciones/${awayCode}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <Users className="h-3 w-3" />
                  XI {awayCode}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && !locked && (
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
  );
}

/* ── Today's matches urgent banner ──────────────────────────── */
function TodayMatchesBanner({ matches, predictionMap }: {
  matches: Match[];
  predictionMap: Map<string, { home: number; away: number }>;
}) {
  const LOCKOUT_MS = 0;
  const now = Date.now();
  const today = new Date().toDateString();

  const urgentMatches = matches.filter((m) => {
    if (m.status !== "scheduled") return false;
    const mt = new Date(m.match_date).getTime();
    const msLeft = mt - now;
    const matchToday = new Date(m.match_date).toDateString() === today;
    return (matchToday || msLeft <= 26 * 60 * 60 * 1000) && msLeft > 0;
  });

  const closingMatches = urgentMatches.filter((m) => {
    const msLeft = new Date(m.match_date).getTime() - now;
    return msLeft > 0 && msLeft <= LOCKOUT_MS;
  });

  if (urgentMatches.length === 0) return null;

  const withoutPrediction = urgentMatches.filter((m) => !predictionMap.has(m.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 mb-4",
        closingMatches.length > 0
          ? "bg-red-500/8 border-red-500/25"
          : "bg-yellow-500/8 border-yellow-500/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
          closingMatches.length > 0 ? "bg-red-500/20" : "bg-yellow-500/20"
        )}>
          {closingMatches.length > 0
            ? <Star className="h-4 w-4 text-red-400 animate-pulse" />
            : <Clock className="h-4 w-4 text-yellow-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-bold",
            closingMatches.length > 0 ? "text-red-400" : "text-yellow-400"
          )}>
            {closingMatches.length > 0
              ? `⚠️ ¡${closingMatches.length} partido${closingMatches.length > 1 ? "s" : ""} cierra${closingMatches.length === 1 ? "" : "n"} en menos de 2 horas!`
              : `📅 Hay ${urgentMatches.length} partido${urgentMatches.length > 1 ? "s" : ""} hoy`
            }
          </p>
          {withoutPrediction.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Te faltan predicciones en <strong className="text-white">{withoutPrediction.length}</strong> de estos partidos.
              Después del pitazo inicial ya no podrás predecir.
            </p>
          )}
          {withoutPrediction.length === 0 && (
            <p className="text-xs text-emerald-400 mt-0.5">
              ✓ Ya tienes todos los partidos de hoy predichos
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Finished Prediction with match events ────────────────── */
interface MatchEvent {
  id: string; type: string; player_name: string; minute: number;
  minute_extra: number; assist_name: string | null; team_id: string | null;
}

function eventIcon(type: string) {
  if (type === "goal" || type === "penalty") return <Goal className="h-3 w-3 text-emerald-400 shrink-0" />;
  if (type === "yellow_card") return <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />;
  if (type === "red_card") return <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />;
  if (type === "substitution") return <ArrowLeftRight className="h-3 w-3 text-blue-400 shrink-0" />;
  return <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />;
}

function FinishedPredictionCard({
  match,
  prediction,
}: {
  match: Match;
  prediction?: { home: number; away: number } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<MatchEvent[] | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const pointsEarned = (() => {
    if (!prediction) return null;
    const { home: ph, away: pa } = prediction;
    const rh = match.home_score ?? 0;
    const ra = match.away_score ?? 0;
    if (ph === rh && pa === ra) return { pts: 5, label: "Exacto", cls: "text-[hsl(var(--primary))]" };
    const pRes = ph > pa ? "H" : ph < pa ? "A" : "D";
    const rRes = rh > ra ? "H" : rh < ra ? "A" : "D";
    if (pRes === rRes) {
      if (pRes === "D") return { pts: 1, label: "Empate correcto", cls: "text-[hsl(var(--accent))]" };
      return { pts: 3, label: "Ganador correcto", cls: "text-[hsl(var(--brand-violet))]" };
    }
    return { pts: 0, label: "Incorrecto", cls: "text-muted-foreground" };
  })();

  const toggleExpand = async () => {
    if (!expanded && events === null) {
      setLoadingEvents(true);
      try {
        const res = await fetch(`/api/matches/${match.id}/events`);
        if (res.ok) setEvents(await res.json());
        else setEvents([]);
      } catch { setEvents([]); }
      setLoadingEvents(false);
    }
    setExpanded(!expanded);
  };

  const homeCode = match.home_team?.fifa_code;
  const awayCode = match.away_team?.fifa_code;

  return (
    <div className="glass rounded-xl border border-border/40 overflow-hidden">
      <button
        className="w-full text-left hover:bg-white/3 transition-colors"
        onClick={toggleExpand}
      >
        <MatchCard match={match} showPrediction={!!prediction} prediction={prediction} compact />
        {/* Points earned row */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          {prediction && pointsEarned !== null && (
            <span className={cn("text-xs font-bold", pointsEarned.cls)}>
              {pointsEarned.pts > 0 ? `+${pointsEarned.pts} pts` : "0 pts"} · {pointsEarned.label}
            </span>
          )}
          {!prediction && <span className="text-xs text-muted-foreground">Sin predicción</span>}
          <div className="flex items-center gap-2">
            {(homeCode || awayCode) && (
              <div className="flex items-center gap-1">
                {homeCode && (
                  <Link href={`/selecciones/${homeCode}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20">
                    <Users className="h-3 w-3" /> XI {homeCode}
                  </Link>
                )}
                {awayCode && (
                  <Link href={`/selecciones/${awayCode}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20">
                    <Users className="h-3 w-3" /> XI {awayCode}
                  </Link>
                )}
              </div>
            )}
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/20 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Prediction detail */}
              {prediction && (
                <div className="rounded-lg bg-white/4 border border-white/8 p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tu predicción</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="text-white">{match.home_team?.short_name ?? match.home_team?.name}</span>
                    <span className={cn("tabular-nums px-2 py-0.5 rounded font-black", pointsEarned?.pts === 5 ? "bg-primary/20 text-primary" : "text-white/70")}>
                      {prediction.home} – {prediction.away}
                    </span>
                    <span className="text-white">{match.away_team?.short_name ?? match.away_team?.name}</span>
                    {pointsEarned && (
                      <span className={cn("ml-auto text-xs font-bold", pointsEarned.cls)}>
                        {pointsEarned.pts > 0 ? `+${pointsEarned.pts}` : "✗"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Match events */}
              {loadingEvents && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <div className="h-3 w-3 border border-muted-foreground/40 border-t-transparent rounded-full animate-spin" />
                  Cargando eventos del partido...
                </div>
              )}
              {!loadingEvents && events && events.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Eventos del partido</p>
                  <div className="space-y-1.5">
                    {events.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-right text-muted-foreground tabular-nums font-mono shrink-0">
                          {e.minute}{e.minute_extra > 0 ? `+${e.minute_extra}` : ""}&apos;
                        </span>
                        {eventIcon(e.type)}
                        <span className="text-white/90 font-medium truncate">{e.player_name}</span>
                        {e.assist_name && (
                          <span className="text-muted-foreground truncate">(A: {e.assist_name})</span>
                        )}
                        {e.type === "penalty" && <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/15 text-yellow-400 font-bold shrink-0">PEN</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!loadingEvents && events !== null && events.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay eventos registrados para este partido.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  const now = Date.now();
  const todayStr = new Date().toDateString();
  const open = allMatches?.filter((m) => m.status === "scheduled" && new Date(m.match_date).getTime() > now) ?? [];
  // Guardadas: today's matches that already have a prediction saved
  const savedToday = allMatches?.filter((m) => {
    const isToday = new Date(m.match_date).toDateString() === todayStr;
    return isToday && predictionMap.has(m.id);
  }) ?? [];
  const finished = allMatches?.filter((m) => m.status === "finished" || (m.status === "scheduled" && new Date(m.match_date).getTime() <= now)) ?? [];
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
          <Badge variant="secondary">{savedToday.length} guardadas hoy</Badge>
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
            Guardadas ({savedToday.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Finalizadas ({finished.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {!isLoading && open.length > 0 && (
            <TodayMatchesBanner matches={open} predictionMap={predictionMap} />
          )}
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : savedToday.length > 0 ? (
              savedToday.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  showPrediction
                  prediction={predictionMap.get(match.id)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Sin predicciones para los partidos de hoy</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Cuando hagas predicciones para los juegos del día, aparecerán aquí</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished">
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : finished.length > 0 ? (
              finished.map((match) => (
                <FinishedPredictionCard
                  key={match.id}
                  match={match}
                  prediction={predictionMap.get(match.id)}
                />
              ))
            ) : (
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
