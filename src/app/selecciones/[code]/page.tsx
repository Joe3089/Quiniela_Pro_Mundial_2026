"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Users, Star, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { getTeamByCode } from "@/data/wc2026-teams";
import { ConfederationBadge } from "@/components/ui/confederation-badge";
import { FlagImage } from "@/components/ui/flag-image";
import { cn } from "@/lib/utils";

const positionColors = {
  GK:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DEF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MID: "bg-green-500/20 text-green-400 border-green-500/30",
  FWD: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TeamDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const team = getTeamByCode(code.toUpperCase());

  if (!team) notFound();

  const gk  = team.players.filter(p => p.position === "GK");
  const def = team.players.filter(p => p.position === "DEF");
  const mid = team.players.filter(p => p.position === "MID");
  const fwd = team.players.filter(p => p.position === "FWD");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/selecciones" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Todas las selecciones
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/8 p-6 mb-6"
      >
        <div className="flex items-start gap-5">
          <FlagImage fifaCode={team.code} fallbackEmoji={team.flag} size="xl" className="rounded-lg shadow-lg shrink-0" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="mb-1"><ConfederationBadge confederation={team.confederation} size="lg" /></div>
                <h1 className="text-3xl font-black text-white mb-1">{team.name}</h1>
                <p className="text-sm text-muted-foreground">{team.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Ranking FIFA</span>
                <span className="text-4xl font-black text-gradient-gold">#{team.fifaRanking}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Entrenador", value: team.coach },
                { label: "Formación", value: team.formation },
                { label: "Mundiales", value: team.worldCupAppearances.toString() },
                { label: "Mejor resultado", value: team.bestResult },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-2.5 border border-white/5">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                  <p className="text-xs font-bold text-white leading-tight">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Jugadores clave */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[hsl(var(--brand-gold)/0.15)] flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
            </div>
            <h2 className="font-bold text-sm">Jugadores clave</h2>
          </div>
          <div className="p-4 space-y-2">
            {team.keyPlayers.map((player) => (
              <div key={player} className="flex items-center gap-2.5 text-sm">
                <Star className="h-3 w-3 text-[hsl(var(--brand-gold))] shrink-0" />
                <span className="text-white">{player}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2">
              <p className="text-xs text-muted-foreground">Máximo goleador histórico</p>
              <p className="text-sm font-bold text-white">{team.topScorer.name} <span className="text-[hsl(var(--brand-gold))]">({team.topScorer.goals} goles)</span></p>
            </div>
          </div>
        </motion.div>

        {/* Once titular */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[hsl(var(--brand-blue)/0.15)] flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5 text-[hsl(var(--brand-blue-light))]" />
            </div>
            <h2 className="font-bold text-sm">XI Posible {team.formation}</h2>
          </div>
          {/* Field visualization */}
          <div className="relative mx-4 my-3 rounded-xl overflow-hidden" style={{ height: 240 }}>
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: "linear-gradient(180deg, #166534 0%, #14532d 50%, #166534 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            {/* Field lines */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-24 h-14 border border-white/20 rounded-sm" />
              <div className="w-full border-t border-white/20 absolute top-1/2" />
              <div className="w-12 h-12 border border-white/20 rounded-full absolute top-1/2 -translate-y-1/2" />
            </div>
            {/* Players */}
            <div className="absolute inset-2 flex flex-col justify-between p-1">
              {/* GK */}
              <div className="flex justify-center">
                <span className="text-[9px] font-bold text-white bg-black/40 rounded px-1">{team.xi[0]}</span>
              </div>
              {/* DEF */}
              <div className="flex justify-around">
                {team.xi.slice(1, 5).map((p, i) => (
                  <span key={i} className="text-[9px] font-bold text-white bg-black/40 rounded px-1">{p}</span>
                ))}
              </div>
              {/* MID */}
              <div className="flex justify-around">
                {team.xi.slice(5, 8).map((p, i) => (
                  <span key={i} className="text-[9px] font-bold text-white bg-black/40 rounded px-1">{p}</span>
                ))}
              </div>
              {/* FWD */}
              <div className="flex justify-around">
                {team.xi.slice(8, 11).map((p, i) => (
                  <span key={i} className="text-[9px] font-bold text-white bg-black/40 rounded px-1">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Plantilla completa */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <h2 className="font-bold text-sm">Plantilla convocada</h2>
          {team.rosterPublished !== false && (
            <span className="ml-auto text-xs text-muted-foreground">{team.players.length} jugadores</span>
          )}
        </div>

        {team.rosterPublished === false ? (
          <div className="p-10 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">Convocatoria no publicada</p>
              <p className="text-xs text-muted-foreground max-w-xs">La FIFA exige la presentación oficial de convocatorias 10 días antes del inicio del torneo (1 de junio).</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Pendiente de publicación
            </div>
          </div>
        ) : (
          <>
            {[
              { label: "Porteros", players: gk, pos: "GK" as const },
              { label: "Defensas", players: def, pos: "DEF" as const },
              { label: "Mediocampistas", players: mid, pos: "MID" as const },
              { label: "Delanteros", players: fwd, pos: "FWD" as const },
            ].map(({ label, players, pos }) =>
              players.length > 0 ? (
                <div key={pos}>
                  <div className={cn("px-4 py-2 text-[10px] font-bold tracking-widest uppercase border-b border-white/5", positionColors[pos])}>
                    {label}
                  </div>
                  <div className="divide-y divide-white/5">
                    {players.map((player) => (
                      <div key={player.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1D4ED8&color=fff&size=64&bold=true&format=svg`}
                          alt={player.name}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-lg object-cover shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                            {player.isCaptain && (
                              <span className="text-[9px] font-bold px-1 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>
                            )}
                            {player.isKeyPlayer && (
                              <Star className="h-2.5 w-2.5 text-[hsl(var(--brand-gold))] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{player.club}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">{player.age} años</span>
                          {player.dorsal && (
                            <span className="text-xs font-bold text-white w-5 text-right">#{player.dorsal}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
