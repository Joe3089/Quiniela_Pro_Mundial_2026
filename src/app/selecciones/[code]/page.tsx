"use client";

import { use, useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, AlertTriangle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { getTeamByCode, type WCPlayer, type WCTeam } from "@/data/wc2026-teams";
import { ConfederationBadge } from "@/components/ui/confederation-badge";
import { FlagImage } from "@/components/ui/flag-image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { TOURNAMENT_ID } from "@/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DbPlayer {
  id: string;
  name: string;
  position: string;
  shirt_number: number | null;
  is_starter: boolean;
  is_captain: boolean;
  is_injured: boolean;
  photo_url: string | null;
  api_football_player_id: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapPosition(dbPos: string): "GK" | "DEF" | "MID" | "FWD" {
  const m: Record<string, "GK" | "DEF" | "MID" | "FWD"> = {
    GK: "GK", DF: "DEF", MF: "MID", FW: "FWD",
  };
  return m[dbPos] ?? "MID";
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts[parts.length - 1] ?? fullName;
}

function isStarter(player: WCPlayer, xi: string[]): boolean {
  const full = player.name.toLowerCase();
  return xi.some((n) => {
    const nl = n.toLowerCase();
    return full.includes(nl) || nl.includes(full.split(" ").pop() ?? "");
  });
}

function enrichPlayer(db: DbPlayer, statics: WCPlayer[]): WCPlayer {
  const full = db.name.toLowerCase();
  const last = full.split(" ").pop() ?? "";
  const match = statics.find((sp) => {
    const sl = sp.name.toLowerCase();
    const ss = sl.split(" ").pop() ?? "";
    return sl === full || ss === last || sl.includes(last) || full.includes(ss);
  });
  return {
    name:          db.name,
    position:      mapPosition(db.position),
    club:          match?.club ?? "",
    age:           match?.age ?? 0,
    dorsal:        db.shirt_number ?? match?.dorsal,
    isCaptain:     db.is_captain || match?.isCaptain,
    isKeyPlayer:   match?.isKeyPlayer,
    photo:         db.photo_url ?? match?.photo,
    apiFootballId: db.api_football_player_id ?? match?.apiFootballId,
  };
}

function parseFormation(f: string): number[] {
  return f.split("-").map(Number).filter(Boolean);
}

// ── PitchPlayer ───────────────────────────────────────────────────────────────

function PitchPlayer({
  player, selected, onClick,
}: { player: WCPlayer; selected: boolean; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const src = player.photo
    ? player.photo
    : player.apiFootballId
    ? `https://media.api-sports.io/football/players/${player.apiFootballId}.png`
    : null;

  const posRing: Record<string, string> = {
    GK: "border-yellow-400", DEF: "border-blue-400",
    MID: "border-green-400", FWD: "border-red-400",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 w-[52px] group transition-transform",
        selected && "scale-110"
      )}
    >
      <div className={cn(
        "relative h-11 w-11 rounded-full border-2 bg-white/10 flex items-center justify-center overflow-hidden transition-all",
        posRing[player.position] ?? "border-white/50",
        selected
          ? "ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.5)]"
          : "group-hover:ring-1 group-hover:ring-white/50"
      )}>
        {src && !imgError ? (
          <img
            src={src} alt={player.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <User className="h-6 w-6 text-white/80" />
        )}
        {player.isCaptain && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[hsl(var(--brand-gold))] border border-black flex items-center justify-center">
            <span className="text-[7px] font-black text-black leading-none">C</span>
          </span>
        )}
      </div>
      {player.dorsal && (
        <span className="text-[8px] font-bold text-white/50 leading-none">#{player.dorsal}</span>
      )}
      <span className="text-[9px] font-semibold text-white/90 leading-tight text-center max-w-[52px] truncate">
        {lastName(player.name)}
      </span>
    </button>
  );
}

// ── Pitch ─────────────────────────────────────────────────────────────────────

function Pitch({ starters, subs, team }: { starters: WCPlayer[]; subs: WCPlayer[]; team: WCTeam }) {
  const [selected, setSelected] = useState<WCPlayer | null>(null);
  const [lineup, setLineup] = useState<WCPlayer[]>([]);

  useEffect(() => { setLineup(starters); }, [starters]);

  const formation = parseFormation(team.formation);
  const gk  = lineup.filter((p) => p.position === "GK").slice(0, 1);
  const def = lineup.filter((p) => p.position === "DEF");
  const mid = lineup.filter((p) => p.position === "MID");
  const fwd = lineup.filter((p) => p.position === "FWD");

  const midGroups: WCPlayer[][] = [];
  let offset = 0;
  for (const n of formation.slice(1, -1)) {
    midGroups.push(mid.slice(offset, offset + n));
    offset += n;
  }

  const rows = [
    fwd.slice(0, formation[formation.length - 1] ?? 1),
    ...midGroups,
    def.slice(0, formation[0] ?? 4),
    gk,
  ].filter((r) => r.length > 0);

  const eligibleSubs = selected
    ? subs.filter((s) => s.position === selected.position && !lineup.some((p) => p.name === s.name))
    : [];

  function swap(starter: WCPlayer, sub: WCPlayer) {
    setLineup((prev) => prev.map((p) => (p.name === starter.name ? sub : p)));
    setSelected(null);
  }

  return (
    <div className="space-y-3">
      {/* Pitch */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#145a21 0%,#1a6b2a 25%,#1e7a30 50%,#1a6b2a 75%,#145a21 100%)",
          boxShadow: "inset 0 0 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* Stripes */}
        <div className="absolute inset-0 pointer-events-none">
          {[0,1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="absolute left-0 right-0" style={{
              top: `${i*12.5}%`, height: "12.5%",
              background: i%2===0 ? "rgba(255,255,255,0.03)" : "transparent",
            }} />
          ))}
        </div>
        {/* Markings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20" />
          <div className="absolute top-2 left-[22%] right-[22%] h-12 border-b-2 border-x-2 border-white/20 rounded-b-xl" />
          <div className="absolute bottom-2 left-[22%] right-[22%] h-12 border-t-2 border-x-2 border-white/20 rounded-t-xl" />
          <div className="absolute inset-2 border border-white/12 rounded-xl" />
        </div>

        {/* Players */}
        <div className="relative py-5 px-3 flex flex-col gap-4">
          {rows.map((row, ri) => (
            <div key={ri} className="flex justify-center items-center gap-1 flex-wrap">
              {row.map((p) => (
                <PitchPlayer
                  key={p.name}
                  player={p}
                  selected={selected?.name === p.name}
                  onClick={() => setSelected(selected?.name === p.name ? null : p)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Formation line */}
      <p className="text-center text-xs text-muted-foreground">
        <span className="font-black text-white/80">{team.formation}</span>
        {" · DT: "}
        <span className="font-semibold text-white/70">{team.coach}</span>
      </p>
      {!selected && <p className="text-center text-[10px] text-muted-foreground/50">Toca un titular para realizar un cambio</p>}

      {/* Swap panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-xl border border-[hsl(var(--primary)/0.3)] p-3">
              <p className="text-xs font-bold text-white mb-2">
                Cambio para <span className="text-[hsl(var(--primary))]">{selected.name}</span>
              </p>
              {eligibleSubs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin suplentes disponibles en esa posición.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {eligibleSubs.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => swap(selected, s)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/8 hover:bg-[hsl(var(--primary)/0.2)] border border-white/10 hover:border-[hsl(var(--primary)/0.4)] transition-all"
                    >
                      {s.name}{s.dorsal ? ` #${s.dorsal}` : ""}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setSelected(null)} className="mt-2 text-[10px] text-muted-foreground hover:text-white">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SubPlayer row ─────────────────────────────────────────────────────────────

function SubPlayer({ player }: { player: WCPlayer }) {
  const [imgError, setImgError] = useState(false);
  const src = player.photo
    ? player.photo
    : player.apiFootballId
    ? `https://media.api-sports.io/football/players/${player.apiFootballId}.png`
    : null;

  return (
    <div className="flex items-center gap-2 py-2 px-1 border-b border-white/5 last:border-0">
      <div className="h-8 w-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
        {src && !imgError ? (
          <img src={src} alt={player.name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <User className="h-4 w-4 text-white/70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-white truncate leading-tight">{player.name}</p>
        {player.club && (
          <p className="text-[9px] text-muted-foreground truncate leading-tight">{player.club}</p>
        )}
      </div>
      {player.dorsal && (
        <span className="text-[10px] font-bold text-white/60 shrink-0">#{player.dorsal}</span>
      )}
    </div>
  );
}

// ── Subs 3-column grid ────────────────────────────────────────────────────────

const COL_HEADER: Record<string, { label: string; color: string; bg: string }> = {
  GK:  { label: "PORTEROS",        color: "text-yellow-400", bg: "bg-yellow-500/15" },
  DEF: { label: "DEFENSAS",        color: "text-blue-400",   bg: "bg-blue-500/15"   },
  MID: { label: "MEDIOCAMPISTAS",  color: "text-green-400",  bg: "bg-green-500/15"  },
  FWD: { label: "DELANTEROS",      color: "text-red-400",    bg: "bg-red-500/15"    },
};

function SubsGrid({ subs }: { subs: WCPlayer[] }) {
  const gk  = subs.filter((p) => p.position === "GK");
  const def = subs.filter((p) => p.position === "DEF");
  const mid = subs.filter((p) => p.position === "MID");
  const fwd = subs.filter((p) => p.position === "FWD");

  // 3 columns: [GK + DEF] | [MID] | [FWD]
  const cols: { pos: string[]; groups: { key: string; players: WCPlayer[] }[] }[] = [
    { pos: ["GK","DEF"], groups: [{ key:"GK", players: gk }, { key:"DEF", players: def }] },
    { pos: ["MID"],      groups: [{ key:"MID", players: mid }] },
    { pos: ["FWD"],      groups: [{ key:"FWD", players: fwd }] },
  ];

  return (
    <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/8">
      {cols.map((col, ci) => (
        <div key={ci} className="bg-[hsl(220_28%_8%)] flex flex-col">
          {col.groups.map(({ key, players }) => {
            if (!players.length) return null;
            const h = COL_HEADER[key];
            return (
              <div key={key}>
                <div className={cn("px-2 py-1.5 text-[9px] font-black tracking-widest uppercase", h.color, h.bg)}>
                  {h.label}
                </div>
                {players.map((p) => <SubPlayer key={p.name} player={p} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── PlayerRoster ──────────────────────────────────────────────────────────────

function PlayerRoster({ team }: { team: WCTeam }) {
  const [dbPlayers, setDbPlayers] = useState<WCPlayer[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    const supabase = createClient() as any;
    const { data: teamRow } = await supabase
      .from("teams")
      .select("id")
      .eq("fifa_code", team.code.toUpperCase())
      .eq("tournament_id", TOURNAMENT_ID)
      .maybeSingle();

    if (!teamRow?.id) { setLoading(false); return; }

    const { data: players } = await supabase
      .from("player_squads")
      .select("id,name,position,shirt_number,is_starter,is_captain,is_injured,photo_url,api_football_player_id")
      .eq("team_id", teamRow.id)
      .eq("tournament_id", TOURNAMENT_ID)
      .order("shirt_number", { ascending: true, nullsFirst: false });

    if (!players?.length) { setLoading(false); return; }

    setDbPlayers((players as DbPlayer[]).map((p) => enrichPlayer(p, team.players)));
    setLoading(false);
  }, [team]);

  useEffect(() => {
    let cancelled = false;
    fetchPlayers().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchPlayers]);

  if (team.rosterPublished === false) {
    return (
      <div className="mt-6 glass-card rounded-2xl border border-white/8 p-10 flex flex-col items-center text-center gap-3">
        <Clock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-bold text-white">Convocatoria no publicada</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          Pendiente de publicación
        </div>
      </div>
    );
  }

  const allPlayers = dbPlayers ?? team.players;
  const starters   = allPlayers.filter((p) => isStarter(p, team.xi));
  const subs        = allPlayers.filter((p) => !isStarter(p, team.xi));

  return (
    <div className="space-y-4">
      {/* XI Titular */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <span className="text-sm font-black text-white">XI Titular</span>
          {loading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          <span className="ml-auto text-xs text-muted-foreground font-medium">{team.formation}</span>
        </div>
        <div className="p-4">
          {starters.length > 0 ? (
            <Pitch starters={starters} subs={subs} team={team} />
          ) : loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando convocatoria…
            </div>
          ) : (
            <p className="text-center py-8 text-sm text-muted-foreground">No hay datos de alineación disponibles.</p>
          )}
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
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-black text-white">Suplentes</span>
            <span className="text-xs text-muted-foreground">{subs.length} jugadores</span>
          </div>
          <div className="p-4">
            <SubsGrid subs={subs} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const team = getTeamByCode(code.toUpperCase());

  if (!team) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/selecciones"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas las selecciones
      </Link>

      {/* Team header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/8 p-6 mb-6"
      >
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
          <FlagImage
            fifaCode={team.code}
            fallbackEmoji={team.flag}
            size="xl"
            className="rounded-xl shadow-lg shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="mb-1"><ConfederationBadge confederation={team.confederation} size="lg" /></div>
                <h1 className="text-2xl font-black text-white mb-1">{team.name}</h1>
                <p className="text-xs text-muted-foreground">{team.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">Ranking FIFA</span>
                <span className="text-4xl font-black text-gradient-gold">#{team.fifaRanking}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Entrenador",    value: team.coach },
                { label: "Formación",     value: team.formation },
                { label: "Mundiales",     value: team.worldCupAppearances.toString() },
                { label: "Mejor result.", value: team.bestResult },
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

      <PlayerRoster team={team} />
    </div>
  );
}
