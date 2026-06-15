"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lock, CheckCircle2, Clock, Users, X, Star, RotateCcw, ChevronDown, User } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/player-avatar";
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

/* ── Kit colors per FIFA code ─────────────────────────────── */
const KIT: Record<string, { p: string; s: string; n: string }> = {
  MEX:{p:"#006847",s:"#FFFFFF",n:"#FFFFFF"}, USA:{p:"#3C3B6E",s:"#B22234",n:"#FFFFFF"},
  CAN:{p:"#D71920",s:"#FFFFFF",n:"#FFFFFF"}, CUW:{p:"#003DA5",s:"#F7D000",n:"#FFFFFF"},
  HAI:{p:"#003087",s:"#D21034",n:"#FFFFFF"}, PAN:{p:"#D71920",s:"#FFFFFF",n:"#FFFFFF"},
  ARG:{p:"#74ACDF",s:"#FFFFFF",n:"#003082"}, BRA:{p:"#009C3B",s:"#FFDF00",n:"#003399"},
  COL:{p:"#FCD116",s:"#003087",n:"#CE1126"}, ECU:{p:"#FFD700",s:"#034EA2",n:"#034EA2"},
  URU:{p:"#72A7D3",s:"#FFFFFF",n:"#FFFFFF"}, PAR:{p:"#D52B1E",s:"#FFFFFF",n:"#0038A8"},
  ESP:{p:"#AA151B",s:"#F1BF00",n:"#FFFFFF"}, FRA:{p:"#002395",s:"#FFFFFF",n:"#FFFFFF"},
  ENG:{p:"#FFFFFF",s:"#CF081F",n:"#CF081F"}, GER:{p:"#FFFFFF",s:"#000000",n:"#000000"},
  POR:{p:"#006600",s:"#FF0000",n:"#FFFFFF"}, NED:{p:"#FF6600",s:"#FFFFFF",n:"#FFFFFF"},
  BEL:{p:"#D60000",s:"#000000",n:"#F7D000"}, CRO:{p:"#FF2020",s:"#FFFFFF",n:"#003DA5"},
  AUT:{p:"#ED2939",s:"#FFFFFF",n:"#FFFFFF"}, CZE:{p:"#D7141A",s:"#11457E",n:"#FFFFFF"},
  SUI:{p:"#FF0000",s:"#FFFFFF",n:"#FFFFFF"}, SCO:{p:"#003F88",s:"#FFFFFF",n:"#FFFFFF"},
  SWE:{p:"#006AA7",s:"#FECC02",n:"#FECC02"}, NOR:{p:"#EF2B2D",s:"#FFFFFF",n:"#FFFFFF"},
  BIH:{p:"#003DA5",s:"#FCCA1B",n:"#FFFFFF"},
  JPN:{p:"#0C1AA8",s:"#FFFFFF",n:"#FFFFFF"}, KOR:{p:"#C3002F",s:"#FFFFFF",n:"#FFFFFF"},
  IRN:{p:"#239F40",s:"#FFFFFF",n:"#FFFFFF"}, KSA:{p:"#006C35",s:"#FFFFFF",n:"#FFFFFF"},
  AUS:{p:"#FFCD00",s:"#003DA5",n:"#003DA5"}, UZB:{p:"#1EB53A",s:"#FFFFFF",n:"#CE1126"},
  JOR:{p:"#007A3D",s:"#000000",n:"#FFFFFF"}, IRQ:{p:"#FFFFFF",s:"#CE1126",n:"#000000"},
  QAT:{p:"#8D153A",s:"#FFFFFF",n:"#FFFFFF"},
  MAR:{p:"#C1272D",s:"#006233",n:"#FFFFFF"}, SEN:{p:"#00853F",s:"#FDEF42",n:"#FDEF42"},
  EGY:{p:"#CE1126",s:"#FFFFFF",n:"#FFFFFF"}, GHA:{p:"#FFFFFF",s:"#000000",n:"#000000"},
  CIV:{p:"#F77F00",s:"#009A44",n:"#FFFFFF"}, RSA:{p:"#007A4D",s:"#FFB81C",n:"#FFFFFF"},
  TUN:{p:"#E70013",s:"#FFFFFF",n:"#FFFFFF"}, ALG:{p:"#006233",s:"#FFFFFF",n:"#FFFFFF"},
  COD:{p:"#007FFF",s:"#F7D00F",n:"#F7D00F"}, CPV:{p:"#003893",s:"#CF2027",n:"#FFFFFF"},
  NZL:{p:"#000000",s:"#FFFFFF",n:"#FFFFFF"},
};

/* ── Jersey SVG ───────────────────────────────────────────── */
function JerseyIcon({ code, size = 36 }: { code: string; size?: number }) {
  const kit = KIT[code] ?? { p: "#1D4ED8", s: "#FFFFFF", n: "#FFFFFF" };
  return (
    <svg viewBox="0 0 36 40" width={size} height={size * 40 / 36} xmlns="http://www.w3.org/2000/svg">
      {/* sleeves */}
      <path d="M6,8 L0,17 L7,19 L7,14Z" fill={kit.s} />
      <path d="M30,8 L36,17 L29,19 L29,14Z" fill={kit.s} />
      {/* body */}
      <path d="M7,8 L0,17 L7,19 L7,38 L29,38 L29,19 L36,17 L29,8 Q23,3 18,5 Q13,3 7,8Z" fill={kit.p} />
      {/* collar */}
      <path d="M13,7 Q18,13 23,7" fill="none" stroke={kit.s} strokeWidth="1.5" />
      {/* sleeve stripe */}
      <path d="M2,14 L6,12 L7,15 L3,17Z" fill={kit.p} opacity="0.4" />
      <path d="M34,14 L30,12 L29,15 L33,17Z" fill={kit.p} opacity="0.4" />
    </svg>
  );
}

/* ── Position slot indices → position type ────────────────── */
const SLOT_POSITION: Record<number, "GK" | "DEF" | "MID" | "FWD"> = {
  0: "GK", 1: "DEF", 2: "DEF", 3: "DEF", 4: "DEF",
  5: "MID", 6: "MID", 7: "MID",
  8: "FWD", 9: "FWD", 10: "FWD",
};

const POS_LABEL = { GK: "Portero", DEF: "Defensa", MID: "Mediocampista", FWD: "Delantero" };
const POS_COLOR = {
  GK:  "text-yellow-400 bg-yellow-500/15 border-yellow-500/25",
  DEF: "text-blue-400   bg-blue-500/15   border-blue-500/25",
  MID: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25",
  FWD: "text-red-400    bg-red-500/15    border-red-500/25",
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

  // User's editable XI — initialized from team.xi, reset on team switch
  const [userXI, setUserXI] = useState<string[]>(team?.xi.slice(0, 11) ?? []);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const switchTeam = useCallback((side: "home" | "away") => {
    const t = side === "home" ? homeTeam : awayTeam;
    setActiveTeam(side);
    setUserXI(t?.xi.slice(0, 11) ?? []);
    setEditingSlot(null);
  }, [homeTeam, awayTeam]);

  const selectPlayer = useCallback((playerName: string) => {
    if (editingSlot === null) return;
    setUserXI(prev => {
      const next = [...prev];
      // Remove player from another slot if already on field
      const existingIdx = next.indexOf(playerName);
      if (existingIdx !== -1 && existingIdx !== editingSlot) next[existingIdx] = "";
      next[editingSlot] = playerName;
      return next;
    });
    setEditingSlot(null);
  }, [editingSlot]);

  if (!homeTeam && !awayTeam) return null;

  const code = team?.code ?? "";
  const editingPos = editingSlot !== null ? SLOT_POSITION[editingSlot] : null;
  const availablePlayers = team?.players.filter(p =>
    !editingPos || p.position === editingPos
  ) ?? [];

  // Field rows: GK | 4 DEF | 3 MID | 3 FWD
  const fieldRows = [
    { slots: [0],          label: "GK" },
    { slots: [1, 2, 3, 4], label: "DEF" },
    { slots: [5, 6, 7],    label: "MID" },
    { slots: [8, 9, 10],   label: "FWD" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full md:max-w-lg bg-[#0d1117] rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden z-10"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sm text-white">XI Titular</h2>
            <p className="text-[10px] text-muted-foreground">Toca una posición para cambiar el jugador</p>
          </div>
          <button
            onClick={() => { setUserXI(team?.xi.slice(0, 11) ?? []); setEditingSlot(null); }}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
            title="Restablecer XI"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Team switcher ── */}
        <div className="flex gap-2 px-3 py-2 border-b border-white/5 shrink-0">
          {[{ side: "home" as const, t: homeTeam }, { side: "away" as const, t: awayTeam }].map(({ side, t }) =>
            t ? (
              <button
                key={side}
                onClick={() => switchTeam(side)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                  activeTeam === side
                    ? "bg-[hsl(var(--brand-blue)/0.2)] border-[hsl(var(--brand-blue)/0.4)] text-white"
                    : "bg-white/3 border-white/8 text-muted-foreground hover:text-white"
                )}
              >
                <span className="text-lg leading-none">{t.flag}</span>
                <span className="truncate">{t.name}</span>
                <span className="ml-auto text-[9px] opacity-60">{t.formation}</span>
              </button>
            ) : null
          )}
        </div>

        {!team ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Sin datos para esta selección</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* ── PITCH ── */}
            <div
              className="relative mx-3 mt-3 mb-1 rounded-2xl overflow-hidden select-none"
              style={{
                background: "linear-gradient(180deg, #166534 0%, #15803d 40%, #166534 60%, #14532d 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                height: 260,
              }}
            >
              {/* Pitch lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 260" preserveAspectRatio="none">
                <rect x="8" y="8" width="304" height="244" rx="4" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                <line x1="8" y1="130" x2="312" y2="130" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <circle cx="160" cy="130" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <rect x="88" y="8" width="144" height="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <rect x="116" y="8" width="88" height="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <rect x="88" y="214" width="144" height="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <rect x="116" y="234" width="88" height="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <circle cx="160" cy="20" r="3" fill="rgba(255,255,255,0.3)" />
                <circle cx="160" cy="240" r="3" fill="rgba(255,255,255,0.3)" />
              </svg>

              {/* Players on pitch (FWD top → GK bottom) */}
              <div className="absolute inset-0 flex flex-col-reverse justify-between py-3 px-2">
                {fieldRows.map(({ slots }) => (
                  <div key={slots[0]} className="flex justify-around items-center">
                    {slots.map((slotIdx) => {
                      const playerName = userXI[slotIdx] ?? "";
                      const lastName = playerName.split(" ").pop() ?? "";
                      const isActive = editingSlot === slotIdx;
                      const pos = SLOT_POSITION[slotIdx];
                      return (
                        <button
                          key={slotIdx}
                          onClick={() => setEditingSlot(isActive ? null : slotIdx)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 group transition-transform active:scale-95",
                            isActive && "scale-110"
                          )}
                        >
                          <div className={cn(
                            "relative h-9 w-9 rounded-full border-2 bg-white/10 flex items-center justify-center",
                            pos === "GK"  ? "border-yellow-400"  :
                            pos === "DEF" ? "border-blue-400"    :
                            pos === "MID" ? "border-emerald-400" : "border-red-400",
                            isActive && "ring-2 ring-[hsl(var(--brand-gold))] ring-offset-1 ring-offset-black"
                          )}>
                            <User className="h-5 w-5 text-white/80" />
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--brand-gold))] rounded-full flex items-center justify-center z-10">
                                <ChevronDown className="w-2 h-2 text-black" />
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "text-[7px] font-bold px-0.5 rounded max-w-[44px] truncate text-center leading-tight mt-0.5",
                            isActive
                              ? "text-[hsl(var(--brand-gold))] bg-[hsl(var(--brand-gold)/0.15)]"
                              : "text-white bg-black/60"
                          )}>
                            {lastName || "—"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Formation label ── */}
            <div className="flex items-center justify-center gap-2 py-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">{team.formation}</span>
              <span className="text-[10px] text-muted-foreground/40">·</span>
              <span className="text-[10px] text-muted-foreground">DT: {team.coach}</span>
            </div>

            {/* ── Player picker (shown when editing a slot) ── */}
            <AnimatePresence>
              {editingSlot !== null && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-[hsl(var(--brand-gold)/0.3)] bg-[hsl(var(--brand-gold)/0.04)]"
                >
                  <div className="px-3 py-2 flex items-center gap-2">
                    <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", POS_COLOR[editingPos!])}>
                      {POS_LABEL[editingPos!]}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Elige el titular para la posición {editingSlot + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-2 pb-2 max-h-44 overflow-y-auto">
                    {availablePlayers.map((p) => {
                      const isOnField = userXI.includes(p.name);
                      const isCurrentSlot = userXI[editingSlot] === p.name;
                      return (
                        <button
                          key={p.name}
                          onClick={() => selectPlayer(p.name)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all border",
                            isCurrentSlot
                              ? "bg-[hsl(var(--brand-gold)/0.2)] border-[hsl(var(--brand-gold)/0.4)] text-white"
                              : isOnField
                                ? "bg-white/3 border-white/5 text-muted-foreground"
                                : "bg-white/5 border-white/8 text-white hover:bg-white/10"
                          )}
                        >
                          <PlayerAvatar
                            player={p}
                            kitColor={KIT[code]?.p ?? "#1D4ED8"}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-semibold truncate leading-tight">
                              {p.name.split(" ").slice(-1)[0]}
                            </div>
                            <div className="text-[8px] text-muted-foreground/70 truncate">{p.club}</div>
                          </div>
                          {p.isCaptain && <span className="shrink-0 text-[8px] font-bold text-[hsl(var(--brand-gold))]">C</span>}
                          {p.isKeyPlayer && !p.isCaptain && <Star className="shrink-0 h-2 w-2 text-[hsl(var(--brand-gold))] fill-current" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Full squad list ── */}
            <div className="border-t border-white/5">
              {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => {
                const group = team.players.filter(p => p.position === pos);
                if (!group.length) return null;
                return (
                  <div key={pos}>
                    <div className={cn("px-4 py-1 text-[9px] font-bold tracking-widest uppercase", POS_COLOR[pos])}>
                      {POS_LABEL[pos]}S
                    </div>
                    {group.map((player) => {
                      const slotOnField = userXI.indexOf(player.name);
                      const isStarter = slotOnField !== -1;
                      return (
                        <div
                          key={player.name}
                          className="flex items-center gap-3 px-4 py-1.5 hover:bg-white/3 transition-colors cursor-pointer"
                          onClick={() => {
                            const posType = player.position;
                            const emptySlot = Object.entries(SLOT_POSITION)
                              .find(([idx, p]) => p === posType && !userXI[+idx]);
                            if (emptySlot) {
                              setEditingSlot(+emptySlot[0]);
                              setTimeout(() => selectPlayer(player.name), 50);
                            } else {
                              setEditingSlot(slotOnField !== -1 ? slotOnField : null);
                            }
                          }}
                        >
                          <div className={cn(
                            "rounded-full ring-1 shrink-0",
                            isStarter ? "ring-emerald-500/40" : "ring-white/10"
                          )}>
                            <PlayerAvatar
                              player={player}
                              kitColor={KIT[code]?.p ?? "#1D4ED8"}
                              size="sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-xs font-semibold truncate", isStarter ? "text-white" : "text-muted-foreground")}>
                                {player.name}
                              </span>
                              {player.isCaptain && <span className="text-[8px] font-bold px-1 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>}
                              {player.isKeyPlayer && <Star className="h-2.5 w-2.5 text-[hsl(var(--brand-gold))] fill-current shrink-0" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground/70 truncate">{player.club}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {player.dorsal && <span className="text-[10px] text-muted-foreground/50 font-mono">#{player.dorsal}</span>}
                            {isStarter && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
                                Titular
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Countdown badge ─────────────────────────────────────── */
function useCountdown(matchDate: string) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  const LOCKOUT_MS = 0; // Lock only at kickoff (status change), not before
  const matchTime = new Date(matchDate).getTime();
  const ms = matchTime - now;
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const isLocking = ms > 0 && ms <= LOCKOUT_MS;          // < 2h left
  const isWarning = ms > LOCKOUT_MS && ms <= 24 * 60 * 60 * 1000; // < 24h left
  const isLocked = ms <= LOCKOUT_MS;

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
  if (ms <= 0) return null; // match started or finished

  if (isLocked) return null; // already locked, handled by parent

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
  const [lineupOpen, setLineupOpen] = useState(false);
  const { isLocked, isLocking } = useCountdown(match.match_date);

  // Override: if match status is not scheduled, it's always locked
  const locked = match.status !== "scheduled" || isLocked;

  const homeTeam = getTeamByCode(match.home_team?.fifa_code ?? "");
  const awayTeam = getTeamByCode(match.away_team?.fifa_code ?? "");

  return (
    <>
      <div className={cn(
        "glass rounded-xl border overflow-hidden transition-all",
        isLocking && !locked ? "border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-border/40"
      )}>
        {/* Countdown reminder banner */}
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

/* ── Today's matches urgent banner ──────────────────────────── */
function TodayMatchesBanner({ matches, predictionMap }: {
  matches: Match[];
  predictionMap: Map<string, { home: number; away: number }>;
}) {
  const LOCKOUT_MS = 0; // Lock only at kickoff (status change), not before
  const now = Date.now();
  const today = new Date().toDateString();

  const urgentMatches = matches.filter((m) => {
    if (m.status !== "scheduled") return false;
    const mt = new Date(m.match_date).getTime();
    const msLeft = mt - now;
    const matchToday = new Date(m.match_date).toDateString() === today;
    const matchTomorrow = new Date(mt - 86_400_000).toDateString() === new Date(now - 86_400_000).toDateString();
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
  const open = allMatches?.filter((m) => m.status === "scheduled" && new Date(m.match_date).getTime() > now) ?? [];
  const withPrediction = allMatches?.filter((m) => predictionMap.has(m.id)) ?? [];
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
