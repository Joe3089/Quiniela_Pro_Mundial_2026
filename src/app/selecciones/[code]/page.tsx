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

      {/* Titulares + Suplentes */}
      <PlayerRoster team={team} />
    </div>
  );
}

// ── PlayerRoster: Titulares and Suplentes sections ─────────────────────────

function playerPhotoUrl(player: import("@/data/wc2026-teams").WCPlayer): string {
  if (player.photo) return player.photo;
  if (player.apiFootballId)
    return `https://media.api-sports.io/football/players/${player.apiFootballId}.png`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1D4ED8&color=fff&size=64&bold=true&format=svg`;
}

function isStarter(player: import("@/data/wc2026-teams").WCPlayer, xi: string[]): boolean {
  const fullLower = player.name.toLowerCase();
  return xi.some((xiName) => {
    const n = xiName.toLowerCase();
    return fullLower.includes(n) || n.includes(fullLower.split(" ").pop() ?? "");
  });
}

function PlayerRow({
  player,
  flagUrl,
  isTitle,
}: {
  player: import("@/data/wc2026-teams").WCPlayer;
  flagUrl?: string | null;
  isTitle: boolean;
}) {
  const posColors = positionColors[player.position];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors">
      {/* Photo */}
      <div className="relative shrink-0">
        <img
          src={playerPhotoUrl(player)}
          alt={player.name}
          width={36}
          height={36}
          className="h-9 w-9 rounded-xl object-cover border border-white/10"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1D4ED8&color=fff&size=64&bold=true&format=svg`;
          }}
        />
        {isTitle && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-black" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{player.name}</span>
          {player.isCaptain && (
            <span className="text-[9px] font-bold px-1 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>
          )}
          {player.isKeyPlayer && (
            <Star className="h-2.5 w-2.5 text-[hsl(var(--brand-gold))] shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Flag */}
          {flagUrl ? (
            <img src={flagUrl} alt="" width={14} height={10}
              className="rounded-sm object-cover shrink-0 opacity-70" />
          ) : null}
          <span className="text-[10px] text-muted-foreground truncate">{player.club}</span>
        </div>
      </div>

      {/* Position + age + dorsal */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", posColors)}>
          {player.position}
        </span>
        <span className="text-xs text-muted-foreground">{player.age}a</span>
        {player.dorsal ? (
          <span className="text-xs font-bold text-white/80 w-5 text-right">#{player.dorsal}</span>
        ) : null}
      </div>
    </div>
  );
}

function PlayerRoster({ team }: { team: import("@/data/wc2026-teams").WCTeam }) {
  const starters = team.players.filter((p) => isStarter(p, team.xi));
  const subs = team.players.filter((p) => !isStarter(p, team.xi));

  // Use first-available flag URL (team flag from teams table if available)
  const flagUrl: string | null = null; // UI-avatars doesn't do flags; FlagImage component handles it

  if (team.rosterPublished === false) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 glass-card rounded-2xl border border-white/8 p-10 flex flex-col items-center text-center gap-3"
      >
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <Clock className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-bold text-white mb-1">Convocatoria no publicada</p>
          <p className="text-xs text-muted-foreground max-w-xs">La FIFA exige la presentación oficial de convocatorias 10 días antes del inicio del torneo.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          Pendiente de publicación
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* 11 Titular */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h2 className="font-bold text-sm">XI Titular · {team.formation}</h2>
          <span className="ml-auto text-xs text-muted-foreground">{starters.length} jugadores</span>
        </div>
        <div className="divide-y divide-white/5">
          {starters.length > 0
            ? starters.map((p) => (
                <PlayerRow key={p.name} player={p} flagUrl={flagUrl} isTitle />
              ))
            : team.xi.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{name}</span>
                </div>
              ))}
        </div>
      </motion.div>

      {/* Suplentes */}
      {subs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <h2 className="font-bold text-sm">Suplentes</h2>
            <span className="ml-auto text-xs text-muted-foreground">{subs.length} jugadores</span>
          </div>
          <div className="divide-y divide-white/5">
            {subs.map((p) => (
              <PlayerRow key={p.name} player={p} flagUrl={flagUrl} isTitle={false} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
