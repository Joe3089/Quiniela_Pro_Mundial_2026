"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Search } from "lucide-react";
import Link from "next/link";
import {
  WC2026_TEAMS,
  CONFEDERATION_ORDER,
  CONFEDERATION_LABELS,
  CONFEDERATION_SPOTS,
  type Confederation,
  type WCTeam,
} from "@/data/wc2026-teams";
import { cn } from "@/lib/utils";

function TeamCard({ team, index }: { team: WCTeam; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/selecciones/${team.code}`}>
        <div className="glass rounded-xl border border-white/5 hover:border-[hsl(var(--brand-blue)/0.4)] p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer">
          <span className="text-3xl leading-none">{team.flag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-[hsl(var(--brand-blue-light))] transition-colors">
              {team.name}
            </p>
            <p className="text-[11px] text-muted-foreground">{team.confederation} · #{team.fifaRanking}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">{team.worldCupAppearances} Mundiales</p>
            <p className="text-[10px] text-[hsl(var(--brand-gold))]">{team.bestResult}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const confColors: Record<Confederation, string> = {
  UEFA:      "text-blue-400 border-blue-400/30 bg-blue-400/10",
  CONMEBOL:  "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  CONCACAF:  "text-green-400 border-green-400/30 bg-green-400/10",
  AFC:       "text-red-400 border-red-400/30 bg-red-400/10",
  CAF:       "text-orange-400 border-orange-400/30 bg-orange-400/10",
  OFC:       "text-teal-400 border-teal-400/30 bg-teal-400/10",
};

export default function SeleccionesPage() {
  const [search, setSearch] = useState("");
  const [activeConf, setActiveConf] = useState<Confederation | "all">("all");

  const filtered = WC2026_TEAMS.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shortName.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesConf = activeConf === "all" || t.confederation === activeConf;
    return matchesSearch && matchesConf;
  });

  const grouped = CONFEDERATION_ORDER.map((conf) => ({
    conf,
    teams: filtered.filter((t) => t.confederation === conf),
  })).filter((g) => g.teams.length > 0);

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
        <p className="text-muted-foreground text-sm">48 selecciones clasificadas · 6 confederaciones</p>
      </motion.div>

      {/* Confederation summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {CONFEDERATION_ORDER.map((conf) => (
          <button
            key={conf}
            onClick={() => setActiveConf(activeConf === conf ? "all" : conf)}
            className={cn(
              "rounded-xl p-2 border text-center transition-all",
              activeConf === conf
                ? confColors[conf]
                : "glass border-white/5 hover:border-white/15 text-muted-foreground"
            )}
          >
            <div className="text-lg font-black">{CONFEDERATION_SPOTS[conf]}</div>
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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-blue)/0.5)] focus:border-[hsl(var(--brand-blue)/0.4)] transition-all"
        />
      </div>

      {/* Teams by confederation */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No se encontraron selecciones</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ conf, teams }) => (
            <div key={conf}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", confColors[conf])}>
                  {conf}
                </span>
                <span className="text-sm text-muted-foreground">{CONFEDERATION_LABELS[conf]}</span>
                <span className="text-xs text-muted-foreground ml-auto">{teams.length} selecciones</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {teams
                  .sort((a, b) => a.fifaRanking - b.fifaRanking)
                  .map((team, i) => (
                    <TeamCard key={team.code} team={team} index={i} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
