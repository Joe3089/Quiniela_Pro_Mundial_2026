"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Target, BarChart3, Zap, ArrowRight, Star, Users, Globe2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";

/* ── Diagonal tricolor panels (desktop right side) ── */
function HeroPanels() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>

      {/* ── Mexico green ── */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(36% 0%, 57% 0%, 41% 100%, 18% 100%)",
        background: "linear-gradient(175deg, #1a5c2e 0%, #0b3318 55%, #041209 100%)",
      }} />
      {/* city-light dots inside green */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(36% 0%, 57% 0%, 41% 100%, 18% 100%)",
        backgroundImage:
          "radial-gradient(circle 3px at 41% 57%, rgba(255,230,100,.70) 0%, transparent 4px)," +
          "radial-gradient(circle 2px at 47% 53%, rgba(255,210,80,.60) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 35% 66%, rgba(255,230,100,.50) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 52% 63%, rgba(255,210,80,.55) 0%, transparent 3px)," +
          "radial-gradient(circle 1.5px at 38% 73%, rgba(255,230,100,.40) 0%, transparent 2px)," +
          "radial-gradient(circle 2px at 54% 71%, rgba(255,210,80,.45) 0%, transparent 3px)," +
          "radial-gradient(circle 1px at 44% 80%, rgba(255,200,80,.35) 0%, transparent 1.5px)",
      }} />
      {/* Angel de Independencia silhouette */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(36% 0%, 57% 0%, 41% 100%, 18% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <rect x="318" y="200" width="9" height="295" fill="rgba(180,255,190,.13)" />
          <rect x="308" y="488" width="29" height="18" fill="rgba(180,255,190,.10)" />
          <ellipse cx="322" cy="192" rx="9" ry="13" fill="rgba(180,255,190,.16)" />
          <path d="M322 192 L288 170 L306 192 Z" fill="rgba(180,255,190,.12)" />
          <path d="M322 192 L356 170 L338 192 Z" fill="rgba(180,255,190,.12)" />
          <rect x="268" y="430" width="22" height="76" fill="rgba(180,255,190,.07)" />
          <rect x="350" y="450" width="16" height="56" fill="rgba(180,255,190,.06)" />
          <rect x="293" y="458" width="13" height="48" fill="rgba(180,255,190,.05)" />
          <rect x="367" y="465" width="18" height="41" fill="rgba(180,255,190,.06)" />
        </svg>
      </div>

      {/* ── White divider 1 ── */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(57% 0%, 60% 0%, 44% 100%, 41% 100%)",
        background: "linear-gradient(175deg, rgba(255,255,255,.42) 0%, rgba(255,255,255,.08) 100%)",
      }} />

      {/* ── USA blue ── */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(60% 0%, 81% 0%, 65% 100%, 44% 100%)",
        background: "linear-gradient(175deg, #0d2268 0%, #071540 55%, #030920 100%)",
      }} />
      {/* city-light dots inside blue */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(60% 0%, 81% 0%, 65% 100%, 44% 100%)",
        backgroundImage:
          "radial-gradient(circle 3px at 67% 34%, rgba(200,220,255,.70) 0%, transparent 4px)," +
          "radial-gradient(circle 2px at 73% 44%, rgba(180,200,255,.60) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 63% 54%, rgba(200,220,255,.55) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 77% 51%, rgba(180,200,255,.55) 0%, transparent 3px)," +
          "radial-gradient(circle 1.5px at 69% 64%, rgba(200,220,255,.40) 0%, transparent 2px)," +
          "radial-gradient(circle 2px at 75% 39%, rgba(200,220,255,.50) 0%, transparent 3px)",
      }} />
      {/* One WTC silhouette */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(60% 0%, 81% 0%, 65% 100%, 44% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <polygon points="488,55 492,0 504,55 500,495" fill="rgba(180,200,255,.15)" />
          <line x1="496" y1="0" x2="496" y2="-35" stroke="rgba(180,200,255,.35)" strokeWidth="2" />
          <rect x="480" y="495" width="30" height="9" fill="rgba(180,200,255,.08)" />
          <rect x="452" y="360" width="22" height="135" fill="rgba(180,200,255,.08)" />
          <rect x="516" y="380" width="18" height="115" fill="rgba(180,200,255,.07)" />
          <rect x="540" y="420" width="14" height="75" fill="rgba(180,200,255,.06)" />
          <rect x="432" y="432" width="16" height="63" fill="rgba(180,200,255,.06)" />
        </svg>
      </div>

      {/* ── White divider 2 ── */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(81% 0%, 84% 0%, 68% 100%, 65% 100%)",
        background: "linear-gradient(175deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,.06) 100%)",
      }} />

      {/* ── Canada red ── */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(84% 0%, 100% 0%, 100% 100%, 68% 100%)",
        background: "linear-gradient(175deg, #720c0c 0%, #450606 55%, #1c0202 100%)",
      }} />
      {/* city-light dots inside red */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(84% 0%, 100% 0%, 100% 100%, 68% 100%)",
        backgroundImage:
          "radial-gradient(circle 3px at 91% 46%, rgba(255,180,180,.62) 0%, transparent 4px)," +
          "radial-gradient(circle 2px at 87% 58%, rgba(255,160,160,.52) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 95% 61%, rgba(255,180,180,.42) 0%, transparent 3px)," +
          "radial-gradient(circle 2px at 89% 39%, rgba(255,160,160,.55) 0%, transparent 3px)," +
          "radial-gradient(circle 1.5px at 97% 70%, rgba(255,180,180,.32) 0%, transparent 2px)",
      }} />
      {/* CN Tower silhouette */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(84% 0%, 100% 0%, 100% 100%, 68% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <polygon points="648,0 650,0 656,495 644,495" fill="rgba(255,180,180,.15)" />
          <ellipse cx="650" cy="278" rx="16" ry="8" fill="rgba(255,180,180,.22)" />
          <line x1="650" y1="0" x2="650" y2="-22" stroke="rgba(255,180,180,.42)" strokeWidth="1.5" />
          <rect x="620" y="405" width="20" height="95" fill="rgba(255,180,180,.08)" />
          <rect x="670" y="425" width="16" height="75" fill="rgba(255,180,180,.07)" />
          <rect x="692" y="452" width="14" height="48" fill="rgba(255,180,180,.06)" />
        </svg>
      </div>

      {/* Blend text area into panels */}
      <div className="absolute inset-0" style={{
        background:
          "linear-gradient(90deg, #080c18 0%, #080c18 10%, rgba(8,12,24,.95) 22%, rgba(8,12,24,.55) 36%, transparent 54%)",
      }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24" style={{ background: "linear-gradient(to top, #080c18, transparent)" }} />
    </div>
  );
}

/* ── Tricolor soccer ball SVG ── */
function SoccerBall({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className="soccer-float"
      style={{ filter: "drop-shadow(0 12px 36px rgba(0,0,0,.7)) drop-shadow(0 0 20px rgba(255,255,255,.12))" }}
    >
      <defs>
        <clipPath id="sball-clip"><circle cx="50" cy="50" r="47" /></clipPath>
        <radialGradient id="sball-base" cx="38%" cy="33%" r="62%">
          <stop offset="0%" stopColor="#1c2b4a" />
          <stop offset="100%" stopColor="#060912" />
        </radialGradient>
        <radialGradient id="sball-shine" cx="32%" cy="28%" r="42%">
          <stop offset="0%" stopColor="rgba(255,255,255,.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#sball-base)" />
      {/* Green slice — Mexico */}
      <path d="M6 42 A47 47 0 0 1 42 6 L50 50Z" fill="rgba(34,197,94,.82)" clipPath="url(#sball-clip)" />
      {/* White divider */}
      <path d="M42 6 L50 6 A47 47 0 0 1 54 6 L50 50Z" fill="rgba(255,255,255,.65)" clipPath="url(#sball-clip)" />
      {/* Blue slice — USA */}
      <path d="M54 6 A47 47 0 0 1 94 50 L50 50Z" fill="rgba(29,78,216,.82)" clipPath="url(#sball-clip)" />
      {/* White divider */}
      <path d="M94 50 L94 57 L50 50Z" fill="rgba(255,255,255,.55)" clipPath="url(#sball-clip)" />
      {/* Red slice — Canada */}
      <path d="M94 57 A47 47 0 0 1 50 97 L50 50Z" fill="rgba(220,38,38,.82)" clipPath="url(#sball-clip)" />
      {/* Pentagon hint */}
      <polygon points="50,25 64,36 58,52 42,52 36,36" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="1" />
      {/* Shine + edge */}
      <circle cx="50" cy="50" r="47" fill="url(#sball-shine)" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Rotating trophy ── */
function TrophyHero() {
  return (
    <div className="relative flex items-center justify-center w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60">
      {/* Ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "-50%",
          background: "radial-gradient(circle, rgba(245,165,0,.22) 0%, transparent 65%)",
          animation: "pulse-glow 3s ease-in-out infinite",
        }}
      />
      {/* Halo rings */}
      <div className="absolute inset-3 rounded-full border border-[rgba(245,165,0,.22)]" style={{ animation: "pulse-glow 3s ease-in-out infinite" }} />
      <div className="absolute inset-7 rounded-full border border-[rgba(245,165,0,.12)]" style={{ animation: "pulse-glow 3s ease-in-out infinite .8s" }} />
      {/* Trophy */}
      <div
        className="relative z-10 trophy-spin-3d"
        style={{ perspective: "600px" }}
      >
        <LogoIcon size={130} animated={false} />
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

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-2026 relative overflow-hidden min-h-[520px] md:min-h-[580px] lg:min-h-[620px] flex items-center">

        {/* Solid dark base */}
        <div className="absolute inset-0 bg-[#080c18]" />

        {/* Diagonal tricolor panels — hidden on small screens */}
        <div className="hidden sm:block">
          <HeroPanels />
        </div>

        {/* Mobile background blob (replaces panels on small screens) */}
        <div className="absolute inset-0 sm:hidden" style={{
          background:
            "radial-gradient(ellipse 80% 60% at -10% 30%, rgba(22,92,46,.30) 0%, transparent 55%)," +
            "radial-gradient(ellipse 60% 50% at 110% 70%, rgba(220,38,38,.18) 0%, transparent 55%)," +
            "radial-gradient(ellipse 70% 60% at 110% 20%, rgba(29,78,216,.22) 0%, transparent 55%)",
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 w-full py-14 md:py-20">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-0">

            {/* ── Left: text ── */}
            <div className="flex-1 md:max-w-[52%] text-center md:text-left order-2 md:order-1">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-bold mb-5 border border-[hsl(var(--brand-blue)/0.3)] text-[hsl(var(--brand-blue-light))]"
              >
                <Star className="h-3 w-3 fill-current" />
                OFFICIAL PREDICTION PLATFORM
                <Star className="h-3 w-3 fill-current" />
              </motion.div>

              {/* FIFA WORLD CUP label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs md:text-sm font-bold tracking-[0.32em] uppercase text-white/45 mb-1.5"
              >
                FIFA WORLD CUP
              </motion.p>

              {/* "2026" hero number */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.55, type: "spring", stiffness: 90 }}
                className="flex items-baseline gap-0 leading-none mb-5"
              >
                <span
                  className="font-black leading-none tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(6rem, 21vw, 13.5rem)",
                    color: "#ffffff",
                    textShadow: "0 0 80px rgba(255,255,255,.14), 0 4px 32px rgba(0,0,0,.7)",
                  }}
                >
                  20
                </span>
                <span
                  className="font-black leading-none tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(6rem, 21vw, 13.5rem)",
                    color: "#4ade80",
                    textShadow: "0 0 80px rgba(74,222,128,.55), 0 4px 32px rgba(0,0,0,.7)",
                    filter: "drop-shadow(0 0 40px rgba(74,222,128,.45))",
                  }}
                >
                  26
                </span>
              </motion.div>

              {/* Host nations */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2.5 justify-center md:justify-start mb-4 text-sm font-black tracking-widest"
              >
                <span style={{ color: "#4ade80" }}>MÉXICO</span>
                <span className="text-white/25">•</span>
                <span className="text-white">USA</span>
                <span className="text-white/25">•</span>
                <span style={{ color: "#f87171" }}>CANADÁ</span>
              </motion.div>

              {/* JUEGA PRONOSTICA GANA with tricolor lines */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 justify-center md:justify-start mb-3"
              >
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#4ade80]" />
                <p className="text-xs font-bold tracking-[0.22em] uppercase text-white/60">
                  JUEGA · PRONOSTICA · GANA
                </p>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#f87171]" />
              </motion.div>

              {/* QUINIELA branding */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.33 }}
                className="text-xs font-black tracking-[0.48em] mb-7 text-center md:text-left"
                style={{ color: "#4ade80" }}
              >
                ── QUINIELA ──
              </motion.p>

              {/* Sub-copy */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36 }}
                className="text-sm text-muted-foreground mb-8 max-w-md mx-auto md:mx-0 leading-relaxed hidden sm:block"
              >
                La quiniela más premium del Mundial. Compite con amigos,
                gana puntos por marcador exacto y sube en el ranking global.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
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

            {/* ── Right: soccer ball + trophy ── */}
            <div className="order-1 md:order-2 flex-shrink-0 flex items-center justify-center gap-6 md:gap-0 md:relative md:w-[48%]">

              {/* Soccer ball — absolute on desktop, inline on mobile */}
              <motion.div
                initial={{ opacity: 0, x: 30, rotate: -15 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ delay: 0.18, duration: 0.65, type: "spring", stiffness: 75 }}
                className="md:absolute md:left-[-16%] md:top-1/2 md:-translate-y-1/2 z-20"
              >
                <SoccerBall size={110} />
              </motion.div>

              {/* Trophy */}
              <motion.div
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.22, duration: 0.65, type: "spring", stiffness: 80 }}
                className="relative z-10 md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2"
              >
                <TrophyHero />
              </motion.div>
            </div>

          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mt-10 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="stat-pill p-3 text-center rounded-2xl">
                <div className="text-lg md:text-2xl font-black text-gradient-gold">{s.value}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-4">
        <section className="pb-20 pt-6">
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
                  style={{ boxShadow: "none" }}
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

        {/* ── SCORING ──────────────────────────────────────────── */}
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
                  <span className="text-2xl font-black tabular-nums w-6 shrink-0" style={{ color: s.color }}>{s.pts}</span>
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

        {/* ── CTA BOTTOM ───────────────────────────────────────── */}
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
