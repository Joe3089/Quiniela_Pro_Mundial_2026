"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe2, Search, Users } from "lucide-react";
import Link from "next/link";
import { FlagImage } from "@/components/ui/flag-image";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfederationBadge } from "@/components/ui/confederation-badge";
import { useTeams } from "@/features/fixtures/hooks/use-fixtures";
import { cn } from "@/lib/utils";
import type { TeamRow } from "@/types/database";

// Normalize continent values from Supabase to confederation codes
function toConf(continent: string): string {
  const map: Record<string, string> = {
    europe: "UEFA",      uefa: "UEFA",
    "south america": "CONMEBOL", conmebol: "CONMEBOL", "america del sur": "CONMEBOL",
    concacaf: "CONCACAF", "north america": "CONCACAF", "norte america": "CONCACAF",
    asia: "AFC",         afc: "AFC",
    africa: "CAF",       caf: "CAF",
    oceania: "OFC",      ofc: "OFC",
  };
  return map[continent.toLowerCase()] ?? continent.toUpperCase();
}

const CONF_ORDER = ["UEFA", "CONMEBOL", "CONCACAF", "AFC", "CAF", "OFC"];
const CONF_LABELS: Record<string, string> = {
  UEFA: "Europa",
  CONMEBOL: "Sudamérica",
  CONCACAF: "Norte, Centroamérica y Caribe",
  AFC: "Asia",
  CAF: "África",
  OFC: "Oceanía",
};
const CONF_COLORS: Record<string, string> = {
  UEFA:     "text-blue-400 border-blue-400/30 bg-blue-400/10",
  CONMEBOL: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  CONCACAF: "text-green-400 border-green-400/30 bg-green-400/10",
  AFC:      "text-red-400 border-red-400/30 bg-red-400/10",
  CAF:      "text-orange-400 border-orange-400/30 bg-orange-400/10",
  OFC:      "text-teal-400 border-teal-400/30 bg-teal-400/10",
};

// Normalize a raw DB row to TeamRow — handles both English and Spanish column names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeam(raw: any): TeamRow {
  return {
    id:            raw.id            ?? "",
    name:          raw.name          ?? raw.nombre        ?? raw.pais        ?? "",
    short_name:    raw.short_name     ?? raw.nombre_corto  ?? raw.nombre      ?? raw.name ?? "",
    flag_url:      raw.flag_url       ?? raw.bandera       ?? raw.escudo      ?? null,
    fifa_code:     raw.fifa_code      ?? raw.codigo_fifa   ?? raw.codigo      ?? raw.code ?? "",
    continent:     raw.continent      ?? raw.confederacion ?? raw.continente  ?? "",
    tournament_id: raw.tournament_id  ?? raw.torneo_id     ?? "",
  };
}

function TeamCard({ team: raw, index }: { team: TeamRow; index: number }) {
  const team = normalizeTeam(raw);
  const conf = toConf(team.continent);
  const code = team.fifa_code.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
    >
      <Link href={`/selecciones/${code}`}>
        <div className="glass rounded-xl border border-white/5 hover:border-[hsl(var(--brand-blue)/0.4)] p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer">
          {/* Flag */}
          {team.flag_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.flag_url}
              alt={team.name}
              width={48}
              height={32}
              className="rounded-sm object-cover w-12 h-8 shrink-0 shadow-sm"
            />
          ) : (
            <FlagImage fifaCode={code} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-[hsl(var(--brand-blue-light))] transition-colors">
              {team.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ConfederationBadge confederation={conf as never} size="sm" />
              <span className="text-[10px] text-muted-foreground font-mono uppercase">{code}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SeleccionesPage() {
  const { data: teams = [], isLoading } = useTeams();
  const [search, setSearch] = useState("");
  const [activeConf, setActiveConf] = useState<string>("all");

  const enriched = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => teams.map((t: any) => ({ ...normalizeTeam(t), conf: toConf(normalizeTeam(t).continent) })),
    [teams]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.short_name.toLowerCase().includes(q) ||
        t.fifa_code.toLowerCase().includes(q);
      const matchConf = activeConf === "all" || t.conf === activeConf;
      return matchSearch && matchConf;
    });
  }, [enriched, search, activeConf]);

  const grouped = useMemo(
    () =>
      CONF_ORDER.map((conf) => ({
        conf,
        teams: filtered.filter((t) => t.conf === conf),
      })).filter((g) => g.teams.length > 0),
    [filtered]
  );

  // Count by confederation
  const confCounts = useMemo(
    () =>
      Object.fromEntries(
        CONF_ORDER.map((c) => [c, enriched.filter((t) => t.conf === c).length])
      ),
    [enriched]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-semibold border border-[hsl(var(--brand-blue)/0.3)] text-[hsl(var(--brand-blue-light))] mb-3">
          <Globe2 className="h-3 w-3" />
          FIFA WORLD CUP 2026
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="text-gradient-vivid">Selecciones</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? "Cargando…" : `${teams.length} selecciones clasificadas · 6 confederaciones`}
        </p>
      </motion.div>

      {/* Confederation filter */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {CONF_ORDER.map((conf) => (
          <button
            key={conf}
            onClick={() => setActiveConf(activeConf === conf ? "all" : conf)}
            className={cn(
              "rounded-xl p-2 border text-center transition-all",
              activeConf === conf
                ? CONF_COLORS[conf]
                : "glass border-white/5 hover:border-white/15 text-muted-foreground"
            )}
          >
            <div className="text-lg font-black">{isLoading ? "–" : (confCounts[conf] ?? 0)}</div>
            <div className="text-[10px] font-bold">{conf}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar selección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-blue)/0.5)] transition-all"
        />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Teams grouped by confederation */}
      {!isLoading && grouped.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No se encontraron selecciones</p>
        </div>
      )}

      {!isLoading && grouped.length > 0 && (
        <div className="space-y-8">
          {grouped.map(({ conf, teams: confTeams }) => (
            <div key={conf}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", CONF_COLORS[conf])}>
                  {conf}
                </span>
                <span className="text-sm text-muted-foreground">{CONF_LABELS[conf]}</span>
                <span className="text-xs text-muted-foreground ml-auto">{confTeams.length} selecciones</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {confTeams.map((team, i) => (
                  <TeamCard key={team.id} team={team} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
