"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Clock, Star, AlertTriangle, Globe2, Users, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  WC_EDITIONS,
  WC_CHAMPIONS,
  ALL_TIME_SCORERS,
  RECORDS_2026,
  CONTINENT_STATS,
  MOST_APPEARANCES,
} from "@/data/wc-history";
import { FlagImage } from "@/components/ui/flag-image";
import { ConfederationBadge } from "@/components/ui/confederation-badge";
import { cn } from "@/lib/utils";

function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <h2 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">{title}</h2>
    </div>
  );
}

/* ── CAMPEONES TAB ──────────────────────────────────────────── */
function CampeonesTab() {
  return (
    <div className="space-y-8">
      {/* Champions ranking */}
      <div>
        <SectionTitle icon={Trophy} title="Países campeones del mundo" color="#F5A500" />
        <div className="space-y-2">
          {WC_CHAMPIONS.sort((a, b) => b.titles - a.titles).map((c, i) => (
            <motion.div
              key={c.country}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3"
            >
              <span className="text-xl font-black text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <FlagImage fifaCode={c.fifaCode} fallbackEmoji={c.flag} size="md" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold text-white">{c.country}</p>
                  <ConfederationBadge confederation={c.confederation} size="sm" />
                </div>
                <p className="text-[11px] text-muted-foreground">{c.years.join(" · ")}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-black text-[hsl(var(--brand-gold))]">{c.titles}</div>
                  <div className="text-[9px] text-muted-foreground">títulos</div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-base font-bold text-muted-foreground">{c.runnerUp}</div>
                  <div className="text-[9px] text-muted-foreground">subcampeonatos</div>
                </div>
                {/* Bar */}
                <div className="w-24 hidden md:block">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.titles / 5) * 100}%`, background: "#F5A500" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Continent stats */}
      <div>
        <SectionTitle icon={Globe2} title="Campeonatos por continente" color="#3b82f6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTINENT_STATS.map((c) => (
            <div key={c.continent} className="glass rounded-xl border border-white/5 p-3">
              <div className="text-2xl font-black mb-1" style={{ color: c.color }}>{c.titles}</div>
              <div className="text-xs font-bold text-white mb-0.5">{c.continent}</div>
              <div className="text-[10px] text-muted-foreground">{c.participations} participaciones · {c.hostTimes}x sede</div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c.titles / 12) * 100}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most appearances */}
      <div>
        <SectionTitle icon={Users} title="Selecciones con más participaciones" color="#10b981" />
        <div className="space-y-2">
          {MOST_APPEARANCES.map((m, i) => (
            <div key={m.country} className="flex items-center gap-3 glass rounded-xl border border-white/5 p-2.5">
              <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
              <FlagImage fifaCode={m.fifaCode ?? ""} fallbackEmoji={m.flag} size="sm" className="shrink-0" />
              <span className="text-sm font-semibold text-white flex-1">{m.country}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden md:block">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(m.count / 22) * 100}%` }} />
                </div>
                <span className="text-sm font-black text-emerald-400 w-6 text-right">{m.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── HISTORIAL TAB ──────────────────────────────────────────── */
function HistorialTab() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Clock} title="Historial de ediciones (1930–2022)" color="#8b5cf6" />
      <div className="space-y-2">
        {[...WC_EDITIONS].reverse().map((ed, i) => (
          <motion.div
            key={ed.year}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass rounded-xl border border-white/5 p-3 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 text-center w-12">
                <div className="text-base font-black text-white">{ed.year}</div>
                <div className="text-[9px] text-muted-foreground">{ed.host}</div>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Campeón</p>
                  <p className="text-xs font-bold text-[hsl(var(--brand-gold))]">{ed.champion}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Subcampeón</p>
                  <p className="text-xs font-semibold text-white">{ed.runnerUp}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Goleador</p>
                  <p className="text-xs text-white truncate">{ed.topScorer.name} ({ed.topScorer.goals}⚽)</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Partidos / Goles</p>
                  <p className="text-xs text-white">{ed.matches} / {ed.totalGoals}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── GOLEADORES TAB ─────────────────────────────────────────── */
function GoladoresTab() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Star} title="Máximos goleadores históricos" color="#F5A500" />
      <div className="space-y-2">
        {ALL_TIME_SCORERS.map((s, i) => (
          <motion.div
            key={s.name + s.country}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3"
          >
            <span className={cn(
              "text-sm font-black w-5 shrink-0 text-center",
              i === 0 ? "text-[hsl(var(--brand-gold))]" : "text-muted-foreground"
            )}>{s.rank}</span>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0f172a&color=94a3b8&size=56&bold=true&format=svg`}
              alt={s.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover shrink-0 border border-white/10"
              loading="lazy"
            />
            <FlagImage fifaCode={s.fifaCode ?? ""} fallbackEmoji={s.flag} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{s.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {s.confederation && <ConfederationBadge confederation={s.confederation} size="sm" />}
                <p className="text-[11px] text-muted-foreground">{s.years}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(s.goals / 16) * 100}%`, background: "#F5A500" }}
                />
              </div>
              <span className="text-2xl font-black text-[hsl(var(--brand-gold))] w-8 text-right">
                {s.goals}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── MUNDIAL 2026 TAB ───────────────────────────────────────── */
function Mundial2026Tab() {
  const liveStats = [
    { label: "Partidos jugados",  value: "0",   max: 104, color: "#3b82f6" },
    { label: "Goles marcados",    value: "0",   max: 300, color: "#F5A500" },
    { label: "Tarjetas amarillas",value: "0",   max: 400, color: "#eab308" },
    { label: "Tarjetas rojas",    value: "0",   max: 30,  color: "#ef4444" },
  ];

  const topCandidates = [
    { name: "Kylian Mbappé",      country: "Francia",    fifaCode: "FRA", flag: "🇫🇷", goals: 0 },
    { name: "Lionel Messi",       country: "Argentina",  fifaCode: "ARG", flag: "🇦🇷", goals: 0 },
    { name: "Julián Álvarez",     country: "Argentina",  fifaCode: "ARG", flag: "🇦🇷", goals: 0 },
    { name: "Vinícius Jr.",       country: "Brasil",     fifaCode: "BRA", flag: "🇧🇷", goals: 0 },
    { name: "Erling Haaland",     country: "Noruega",    fifaCode: "NOR", flag: "🇳🇴", goals: 0 },
    { name: "Harry Kane",         country: "Inglaterra", fifaCode: "ENG", flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="glass-card rounded-2xl border border-[hsl(var(--brand-blue)/0.3)] p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-blue)/0.08)] to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-[hsl(var(--brand-blue-light))] bg-[hsl(var(--brand-blue)/0.1)] border border-[hsl(var(--brand-blue)/0.25)] px-3 py-1 rounded-full mb-3">
          <Zap className="h-3 w-3" />
          EN VIVO · EMPIEZA EL 11 DE JUNIO 2026
        </div>
        <p className="text-2xl font-black text-white mb-1">Mundial FIFA 2026</p>
        <p className="text-sm text-muted-foreground">EE.UU. · Canadá · México · 48 equipos · 104 partidos</p>
      </div>

      {/* Live stats grid */}
      <div>
        <SectionTitle icon={TrendingUp} title="Estadísticas en vivo" color="#3b82f6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {liveStats.map((s) => (
            <div key={s.label} className="glass rounded-xl border border-white/5 p-3 text-center">
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "0%", background: s.color }} />
              </div>
              <div className="text-[9px] text-muted-foreground mt-1">de {s.max} posibles</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top scorer candidates */}
      <div>
        <SectionTitle icon={Star} title="Candidatos al Bota de Oro" color="#F5A500" />
        <div className="space-y-2">
          {topCandidates.map((c, i) => (
            <div key={c.name} className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1D4ED8&color=fff&size=56&bold=true&format=svg`}
                alt={c.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover shrink-0"
                loading="lazy"
              />
              <FlagImage fifaCode={c.fifaCode} fallbackEmoji={c.flag} size="sm" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.country}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black text-[hsl(var(--brand-gold))]">{c.goals}</span>
                <p className="text-[9px] text-muted-foreground">goles</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament info */}
      <div>
        <SectionTitle icon={Globe2} title="Datos del torneo" color="#10b981" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Equipos", value: "48", sub: "6 confederaciones" },
            { label: "Grupos", value: "12", sub: "A–L, 4 equipos c/u" },
            { label: "Partidos", value: "104", sub: "Fase de grupos + eliminatorias" },
            { label: "Sedes", value: "16", sub: "3 países anfitriones" },
            { label: "Inicio", value: "11 Jun", sub: "Ciudad de México" },
            { label: "Final", value: "19 Jul", sub: "MetLife Stadium, NJ" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl border border-white/5 p-3">
              <div className="text-xl font-black text-emerald-400 mb-0.5">{s.value}</div>
              <div className="text-xs font-bold text-white">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── RÉCORDS TAB ────────────────────────────────────────────── */
function RecordsTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={AlertTriangle} title="Récords vulnerables en 2026" color="#ef4444" />
        <p className="text-xs text-muted-foreground mb-4">Récords históricos que podrían romperse o igualarse en el Mundial 2026</p>
        <div className="space-y-3">
          {RECORDS_2026.filter(r => r.vulnerable).map((rec, i) => (
            <motion.div
              key={rec.record}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl border border-red-500/20 bg-red-500/5 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{rec.category}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{rec.record}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 shrink-0 whitespace-nowrap">
                  En riesgo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Actual</p>
                  <p className="text-xs font-semibold text-white">{rec.holder}</p>
                  <p className="text-xs text-[hsl(var(--brand-gold))]">{rec.value}</p>
                </div>
                {rec.challengedBy && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Candidato a romperlo</p>
                    <p className="text-xs font-semibold text-red-400">{rec.challengedBy}</p>
                  </div>
                )}
              </div>
              {rec.context && (
                <p className="text-[11px] text-muted-foreground italic">{rec.context}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon={Trophy} title="Récords históricos sólidos" color="#F5A500" />
        <div className="space-y-2">
          {RECORDS_2026.filter(r => !r.vulnerable).map((rec, i) => (
            <div key={rec.record} className="glass rounded-xl border border-white/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[hsl(var(--brand-gold))] uppercase tracking-wider">{rec.category}</span>
                  <p className="text-xs font-bold text-white mt-0.5">{rec.record}</p>
                  <p className="text-xs text-muted-foreground">{rec.holder} — <span className="text-white">{rec.value}</span></p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 shrink-0 whitespace-nowrap">
                  Sólido
                </span>
              </div>
              {rec.context && (
                <p className="text-[11px] text-muted-foreground italic mt-1.5">{rec.context}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PAGE ───────────────────────────────────────────────────── */
export default function EstadisticasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-semibold border border-[hsl(var(--brand-gold)/0.3)] text-[hsl(var(--brand-gold))] mb-3">
          <TrendingUp className="h-3 w-3" />
          DATOS HISTÓRICOS FIFA
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="text-gradient-gold">Estadísticas</span>
        </h1>
        <p className="text-muted-foreground text-sm">Mundial FIFA desde 1930 hasta 2022 · 22 ediciones · {WC_EDITIONS.reduce((s, e) => s + e.totalGoals, 0).toLocaleString()} goles históricos</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Ediciones",       value: "22",    color: "#3b82f6" },
          { label: "Países campeones", value: "8",    color: "#F5A500" },
          { label: "Goles totales",   value: "2,548", color: "#10b981" },
          { label: "Años de historia","value": "96",  color: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-white/5 p-3 text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mundial2026">
        <TabsList className="mb-6 glass border border-border/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="mundial2026" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            Mundial 2026
          </TabsTrigger>
          <TabsTrigger value="campeones" className="gap-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5" />
            Campeones
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="goleadores" className="gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5" />
            Goleadores
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Récords 2026
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mundial2026"><Mundial2026Tab /></TabsContent>
        <TabsContent value="campeones"><CampeonesTab /></TabsContent>
        <TabsContent value="historial"><HistorialTab /></TabsContent>
        <TabsContent value="goleadores"><GoladoresTab /></TabsContent>
        <TabsContent value="records"><RecordsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
