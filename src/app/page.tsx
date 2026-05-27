"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Target, BarChart3, Zap, ArrowRight,
  Star, Users, Globe2, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════
   TROPHY — mix-blend-mode: screen elimina el fondo oscuro
   del PNG dejando solo la copa dorada sobre la foto.
   ════════════════════════════════════════════════════════ */
function TrophyImage() {
  return (
    <div className="relative w-full h-full" style={{ perspective: "1200px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/trophy.png"
        alt="FIFA World Cup Trophy"
        className="trophy-spin-photo absolute inset-0 w-full h-full"
        style={{
          objectFit: "contain",
          objectPosition: "center 40%",
          mixBlendMode: "screen",
          filter: "drop-shadow(0 4px 28px rgba(245,165,0,0.55)) drop-shadow(0 0 50px rgba(245,165,0,0.28))",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CITY REVEAL PANELS — colored covers that fade away
   in sequence to reveal the photo underneath
   ════════════════════════════════════════════════════════ */
function CityRevealPanels() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

      {/* Panel balón + México (verde) — sale primero */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 0.55, duration: 0.70, ease: "easeInOut" }}
        style={{
          clipPath: "polygon(33% 0%,60% 0%,44% 100%,15% 100%)",
          background: "linear-gradient(175deg,#1d7038 0%,#0e4020 50%,#041408 100%)",
        }}
      />

      {/* Panel Nueva York (azul) — sale segundo */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.10, duration: 0.70, ease: "easeInOut" }}
        style={{
          clipPath: "polygon(60% 0%,81% 0%,65% 100%,44% 100%)",
          background: "linear-gradient(175deg,#0c2060 0%,#071440 50%,#020818 100%)",
        }}
      />

      {/* Panel Toronto (rojo) — sale tercero, se va a 0 para revelar la ciudad */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.65, duration: 0.75, ease: "easeInOut" }}
        style={{
          clipPath: "polygon(81% 0%,100% 0%,100% 100%,65% 100%)",
          background: "linear-gradient(175deg,#880e0e 0%,#500808 50%,#1e0202 100%)",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TROPHY OVERLAY — sin panel oscuro. La copa usa screen
   blend y se integra directo sobre la foto. Solo un fade
   pequeño cubre el logo FIFA del fondo.
   ════════════════════════════════════════════════════════ */
function TrophyOverlay() {
  return (
    <>
      {/* Cubre solo el logo FIFA en la esquina inferior derecha.
          z-index 9: queda por debajo del contenido/stats */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: "24%",
          height: "22%",
          zIndex: 9,
          background: "linear-gradient(to top, rgba(5,1,1,0.97) 38%, rgba(5,1,1,0.50) 68%, transparent 100%)",
        }}
      />

      {/* Copa girando — sin fondo oscuro, screen blend la integra a la foto */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{ width: "22%", zIndex: 22 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.20, duration: 1.10, ease: "easeOut" }}
      >
        <TrophyImage />
      </motion.div>
    </>
  );
}

/* ════════════════════════════════════════════════════════
   FEATURE CARDS
   ════════════════════════════════════════════════════════ */
const features = [
  { icon: Target,      title: "Predicciones",   desc: "Pronostica cada partido antes que empiece. Gana hasta 5 pts por marcador exacto.", href: "/predictions",  className: "card-blue",    iconColor: "text-[hsl(var(--brand-blue-light))]", iconBg: "bg-[hsl(var(--brand-blue)/0.2)]",   accent: "#1D4ED8" },
  { icon: BarChart3,   title: "Ranking en vivo", desc: "Actualización en tiempo real. Compite en el leaderboard global del Mundial.",     href: "/rankings",     className: "card-gold",    iconColor: "text-[hsl(var(--brand-gold))]",       iconBg: "bg-[hsl(var(--brand-gold)/0.18)]",  accent: "#F5A500" },
  { icon: Globe2,      title: "Selecciones",     desc: "Plantillas, estadísticas históricas y formaciones de las 48 selecciones.",        href: "/selecciones",  className: "card-emerald", iconColor: "text-emerald-400",                    iconBg: "bg-[rgba(16,185,129,0.15)]",        accent: "#10B981" },
  { icon: ShieldCheck, title: "Estadísticas",    desc: "Datos históricos desde 1930. Récords mundiales, goleadores y más.",              href: "/estadisticas", className: "card-violet",  iconColor: "text-violet-400",                     iconBg: "bg-[rgba(139,92,246,0.15)]",        accent: "#8B5CF6" },
];

const stats = [
  { value: "48",    label: "Selecciones" },
  { value: "104",   label: "Partidos"    },
  { value: "12",    label: "Grupos"      },
  { value: "16",    label: "Octavos"     },
  { value: "5 pts", label: "Exacto"      },
  { value: "3 pts", label: "Ganador"     },
];

/* ════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[580px] lg:min-h-[620px]">

        {/* Fondo: imagen real */}
        <Image
          src="/hero-bg.jpeg"
          alt="FIFA World Cup 2026"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: "50% 18%" }}
          aria-hidden
        />

        {/* Panels de ciudad que se van revelando */}
        <CityRevealPanels />

        {/* Trofeo giratorio (aparece al final de la secuencia) */}
        <TrophyOverlay />

        {/* Overlay izquierdo para legibilidad del texto */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg," +
              "rgba(5,8,16,0.97) 0%," +
              "rgba(5,8,16,0.94) 16%," +
              "rgba(5,8,16,0.78) 28%," +
              "rgba(5,8,16,0.40) 40%," +
              "rgba(5,8,16,0.08) 54%," +
              "transparent 66%)",
          }}
        />

        {/* Fade inferior */}
        <div
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top,#080c18 0%,rgba(8,12,24,0.55) 55%,transparent 100%)" }}
        />
        {/* Fade superior */}
        <div
          className="absolute top-0 inset-x-0 h-14 pointer-events-none"
          style={{ background: "linear-gradient(to bottom,rgba(5,8,16,0.55),transparent)" }}
        />

        {/* CONTENIDO */}
        <div className="relative z-[30] max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col min-h-[520px] md:min-h-[580px] lg:min-h-[620px] justify-center">

            <div className="px-5 md:px-10 lg:px-14 py-16 md:py-20 w-full md:max-w-[50%] lg:max-w-[46%] text-center md:text-left">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-bold mb-5 border border-[hsl(var(--brand-blue)/0.35)] text-[hsl(var(--brand-blue-light))]"
              >
                <Star className="h-3 w-3 fill-current" />
                OFFICIAL PREDICTION PLATFORM
                <Star className="h-3 w-3 fill-current" />
              </motion.div>

              {/* FIFA WORLD CUP */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="text-xs md:text-sm font-bold tracking-[0.34em] uppercase text-white/45 mb-1.5"
              >
                FIFA WORLD CUP
              </motion.p>

              {/* 2026 — más pequeño, animación de entrada */}
              <motion.div
                initial={{ opacity: 0, scale: 0.72, y: 20 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                transition={{ delay: 0.12, duration: 0.60, type: "spring", stiffness: 95, damping: 14 }}
                className="flex items-baseline justify-center md:justify-start leading-none mb-4"
              >
                <span
                  className="font-black tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(4.2rem,13vw,9rem)",
                    color: "#ffffff",
                    textShadow: "0 2px 40px rgba(0,0,0,.95),0 0 60px rgba(255,255,255,.08)",
                  }}
                >20</span>
                <span
                  className="font-black tracking-tighter select-none"
                  style={{
                    fontSize: "clamp(4.2rem,13vw,9rem)",
                    color: "#4ade80",
                    textShadow: "0 2px 40px rgba(0,0,0,.95),0 0 70px rgba(74,222,128,.55)",
                    filter: "drop-shadow(0 0 36px rgba(74,222,128,.45))",
                  }}
                >26</span>
              </motion.div>

              {/* Host nations */}
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 }}
                className="flex items-center gap-3 justify-center md:justify-start mb-4 font-black tracking-widest text-sm md:text-base"
              >
                <span style={{ color: "#4ade80" }}>MÉXICO</span>
                <span className="text-white/25">•</span>
                <span className="text-white">USA</span>
                <span className="text-white/25">•</span>
                <span style={{ color: "#f87171" }}>CANADÁ</span>
              </motion.div>

              {/* Slogan */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="flex items-center gap-3 justify-center md:justify-start mb-3"
              >
                <div className="h-px w-9 bg-gradient-to-r from-transparent to-[#4ade80]"/>
                <p className="text-xs font-bold tracking-[0.22em] text-white/60">JUEGA · PRONOSTICA · GANA</p>
                <div className="h-px w-9 bg-gradient-to-l from-transparent to-[#f87171]"/>
              </motion.div>

              {/* QUINIELA */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.31 }}
                className="text-xs font-black tracking-[0.50em] mb-7 text-center md:text-left"
                style={{ color: "#4ade80" }}
              >── QUINIELA ──</motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
              >
                <Button size="xl" asChild
                  className="bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-bold shadow-[0_0_32px_rgba(29,78,216,0.5)] hover:shadow-[0_0_48px_rgba(29,78,216,0.7)] transition-all">
                  <Link href="/auth/register">
                    <Trophy className="h-5 w-5"/>
                    Unirme gratis
                    <ArrowRight className="h-5 w-5"/>
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild className="font-semibold">
                  <Link href="/auth/login">Ya tengo cuenta</Link>
                </Button>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.50 }}
              className="grid grid-cols-3 md:grid-cols-6 gap-2 px-5 md:px-10 lg:px-14 pb-10"
            >
              {stats.map(s => (
                <div key={s.label} className="stat-pill p-3 text-center rounded-2xl">
                  <div className="text-lg md:text-2xl font-black text-gradient-gold">{s.value}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <div className="relative max-w-6xl mx-auto px-4">
        <section className="pb-20 pt-8">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground mb-8"
          >TODO LO QUE NECESITAS</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={f.href}
                  className={`relative rounded-2xl p-5 ${f.className} overflow-hidden block group transition-all hover:-translate-y-1.5 duration-200`}
                  style={{ boxShadow: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${f.accent}22`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <div className={`h-10 w-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                    <f.icon className={`h-5 w-5 ${f.iconColor}`}/>
                  </div>
                  <h3 className="font-bold text-white mb-1.5 flex items-center gap-2">
                    {f.title}
                    <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all"/>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ SCORING ══════════════════════════════════════ */}
        <section className="pb-20 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 border border-[hsl(var(--brand-gold)/0.15)]">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Zap className="h-5 w-5 text-[hsl(var(--brand-gold))]"/>
              <h2 className="text-base font-bold tracking-wide">SISTEMA DE PUNTOS</h2>
            </div>
            <div className="space-y-4">
              {[
                { pts: 5, label: "Marcador exacto + ganador",   pct: "100%", color: "#F5A500" },
                { pts: 3, label: "Ganador correcto",             pct: "60%",  color: "#1D4ED8" },
                { pts: 2, label: "Empate exacto",                pct: "40%",  color: "#60A5FA" },
                { pts: 1, label: "Empate (resultado correcto)",  pct: "20%",  color: "#94a3b8" },
                { pts: 0, label: "Predicción incorrecta",        pct: "0%",   color: "#475569" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-4">
                  <span className="text-2xl font-black tabular-nums w-6 shrink-0" style={{ color: s.color }}>{s.pts}</span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: s.pct, background: s.color }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══ CTA BOTTOM ══════════════════════════════════ */}
        <section className="pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-5">
              <Users className="h-4 w-4"/>
              <span>Diseñado para grupos de amigos, oficinas y comunidades</span>
            </div>
            <Button size="lg" asChild
              className="bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-bold shadow-[0_0_24px_rgba(29,78,216,0.4)] hover:shadow-[0_0_40px_rgba(29,78,216,0.6)] transition-all">
              <Link href="/auth/register">
                Empezar ahora — es gratis
                <ArrowRight className="h-4 w-4"/>
              </Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
