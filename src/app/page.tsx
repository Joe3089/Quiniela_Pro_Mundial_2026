"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Target, BarChart3, Zap, ArrowRight, Star, Users, Globe2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";

function TrophyHero() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand-gold)/0.08)] blur-3xl scale-[2]" />
      {/* Gold pulsing halo */}
      <div
        className="absolute inset-4 rounded-full border border-[hsl(var(--brand-gold)/0.2)]"
        style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
      />
      <div
        className="absolute inset-8 rounded-full border border-[hsl(var(--brand-gold)/0.12)]"
        style={{ animation: "pulse-glow 3s ease-in-out infinite 0.8s" }}
      />
      {/* Trophy itself */}
      <div className="relative z-10">
        <LogoIcon size={110} animated />
      </div>
    </div>
  );
}

const features = [
  {
    icon: Target,
    title: "Predicciones",
    desc: "Pronostica cada partido antes que empiece. Gana hasta 5 pts por marcador exacto.",
    href: "/predictions",
    className: "card-blue",
    iconColor: "text-[hsl(var(--brand-blue-light))]",
    iconBg: "bg-[hsl(var(--brand-blue)/0.2)]",
    accent: "#1D4ED8",
  },
  {
    icon: BarChart3,
    title: "Ranking en vivo",
    desc: "Actualización en tiempo real. Compite en el leaderboard global del Mundial.",
    href: "/rankings",
    className: "card-gold",
    iconColor: "text-[hsl(var(--brand-gold))]",
    iconBg: "bg-[hsl(var(--brand-gold)/0.18)]",
    accent: "#F5A500",
  },
  {
    icon: Globe2,
    title: "Selecciones",
    desc: "Plantillas, estadísticas históricas y formaciones de las 48 selecciones.",
    href: "/selecciones",
    className: "card-emerald",
    iconColor: "text-emerald-400",
    iconBg: "bg-[rgba(16,185,129,0.15)]",
    accent: "#10B981",
  },
  {
    icon: ShieldCheck,
    title: "Estadísticas",
    desc: "Datos históricos desde 1930. Récords mundiales, goleadores y más.",
    href: "/estadisticas",
    className: "card-violet",
    iconColor: "text-violet-400",
    iconBg: "bg-[rgba(139,92,246,0.15)]",
    accent: "#8B5CF6",
  },
];

const stats = [
  { value: "48", label: "Selecciones" },
  { value: "104", label: "Partidos" },
  { value: "12", label: "Grupos" },
  { value: "16", label: "Octavos" },
  { value: "5 pts", label: "Exacto" },
  { value: "3 pts", label: "Ganador" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-blue  w-[700px] h-[700px] -top-48 -left-48 opacity-35" />
      <div className="blob blob-navy w-[500px] h-[500px] top-1/2 -right-40 opacity-25" />
      <div className="blob blob-gold  w-[400px] h-[400px] bottom-32 left-1/4 opacity-18" />

      {/* Tricolor host-nation accent strip (top) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-[hsl(var(--brand-blue))] to-red-500 opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="hero-diagonal pt-14 pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Left: text */}
            <div className="flex-1 text-center md:text-left order-2 md:order-1 relative z-10">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-bold mb-6 border border-[hsl(var(--brand-blue)/0.3)] text-[hsl(var(--brand-blue-light))]"
              >
                <Star className="h-3 w-3 fill-current" />
                OFFICIAL PREDICTION PLATFORM
                <Star className="h-3 w-3 fill-current" />
              </motion.div>

              {/* FIFA WC label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-muted-foreground mb-2"
              >
                FIFA WORLD CUP
              </motion.p>

              {/* "2026" — the money shot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.55, type: "spring", stiffness: 90 }}
                className="relative leading-none mb-4 flex items-baseline gap-0"
              >
                <span
                  className="font-black leading-none tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(5.5rem,20vw,12rem)",
                    color: "#ffffff",
                    textShadow: "0 0 80px rgba(255,255,255,0.15), 0 4px 32px rgba(0,0,0,0.6)",
                  }}
                >
                  20
                </span>
                <span
                  className="font-black leading-none tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(5.5rem,20vw,12rem)",
                    color: "#4ade80",
                    textShadow: "0 0 80px rgba(74,222,128,0.5), 0 4px 32px rgba(0,0,0,0.6)",
                    filter: "drop-shadow(0 0 40px rgba(74,222,128,0.4))",
                  }}
                >
                  26
                </span>
              </motion.div>

              {/* Country names tricolor with flags */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 justify-center md:justify-start mb-5 text-sm font-bold tracking-widest"
              >
                <span className="text-green-400">🇲🇽 MÉXICO</span>
                <span className="text-white/30">·</span>
                <span className="text-blue-400">🇺🇸 USA</span>
                <span className="text-white/30">·</span>
                <span className="text-red-400">🇨🇦 CANADÁ</span>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm md:text-base font-bold tracking-[0.18em] uppercase text-white/60 mb-2"
              >
                JUEGA · PRONOSTICA · GANA
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-muted-foreground mb-8 max-w-md mx-auto md:mx-0 leading-relaxed"
              >
                La quiniela más premium del Mundial. Compite con amigos,
                gana puntos por marcador exacto y sube en el ranking global.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
              >
                <Button
                  size="xl"
                  asChild
                  className="bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-bold shadow-[0_0_32px_rgba(29,78,216,0.5)] hover:shadow-[0_0_48px_rgba(29,78,216,0.7)] transition-all"
                >
                  <Link href="/auth/register">
                    <Trophy className="h-5 w-5" />
                    Unirme gratis
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild className="font-semibold">
                  <Link href="/auth/login">Ya tengo cuenta</Link>
                </Button>
              </motion.div>
            </div>

            {/* Right: trophy */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.65, type: "spring", stiffness: 80 }}
              className="order-1 md:order-2 flex-shrink-0 relative z-10"
            >
              <TrophyHero />
            </motion.div>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mt-12 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="stat-pill p-3 text-center rounded-2xl"
              >
                <div className="text-lg md:text-2xl font-black text-gradient-gold">{s.value}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── FEATURES ─────────────────────────────────── */}
        <section className="pb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground mb-8"
          >
            TODO LO QUE NECESITAS
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={f.href}
                  className={`relative rounded-2xl p-5 ${f.className} overflow-hidden block group transition-all hover:-translate-y-1.5 duration-200`}
                  style={{ boxShadow: `0 0 0 0 ${f.accent}00` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${f.accent}22`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div className={`h-10 w-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                    <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-white mb-1.5 flex items-center gap-2">
                    {f.title}
                    <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SCORING ──────────────────────────────────── */}
        <section className="pb-20 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 border border-[hsl(var(--brand-gold)/0.15)]"
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Zap className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
              <h2 className="text-base font-bold tracking-wide">SISTEMA DE PUNTOS</h2>
            </div>
            <div className="space-y-4">
              {[
                { pts: 5, label: "Marcador exacto + ganador", pct: "100%", color: "#F5A500" },
                { pts: 3, label: "Ganador correcto",           pct: "60%",  color: "#1D4ED8" },
                { pts: 2, label: "Empate exacto",              pct: "40%",  color: "#60A5FA" },
                { pts: 1, label: "Empate (resultado correcto)", pct: "20%", color: "#94a3b8" },
                { pts: 0, label: "Predicción incorrecta",       pct: "0%",  color: "#475569" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4">
                  <span className="text-2xl font-black tabular-nums w-6 shrink-0" style={{ color: s.color }}>
                    {s.pts}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: s.pct, background: s.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── CTA BOTTOM ───────────────────────────────── */}
        <section className="pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-5">
              <Users className="h-4 w-4" />
              <span>Diseñado para grupos de amigos, oficinas y comunidades</span>
            </div>
            <Button
              size="lg"
              asChild
              className="bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-bold shadow-[0_0_24px_rgba(29,78,216,0.4)] hover:shadow-[0_0_40px_rgba(29,78,216,0.6)] transition-all"
            >
              <Link href="/auth/register">
                Empezar ahora — es gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
