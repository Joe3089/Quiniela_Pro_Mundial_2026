"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Target, BarChart3, Zap, ArrowRight,
  Star, Users, Globe2, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════
   FIFA WORLD CUP TROPHY — stylised SVG (real trophy shape)
   ════════════════════════════════════════════════════════ */
function FIFATrophy({ size = 220 }: { size?: number }) {
  const h = Math.round(size * 1.28);
  return (
    <svg width={size} height={h} viewBox="0 0 100 128" aria-hidden fill="none">
      <defs>
        <linearGradient id="tg-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF9C0"/>
          <stop offset="18%"  stopColor="#FFE566"/>
          <stop offset="55%"  stopColor="#F5A500"/>
          <stop offset="100%" stopColor="#7A4A00"/>
        </linearGradient>
        <linearGradient id="tg-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6B3800"/>
          <stop offset="35%"  stopColor="#FFD700"/>
          <stop offset="65%"  stopColor="#FFE88A"/>
          <stop offset="100%" stopColor="#A06000"/>
        </linearGradient>
        <linearGradient id="tg-shine" x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.32)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <radialGradient id="tg-ambient" cx="50%" cy="60%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,200,0,0.22)"/>
          <stop offset="100%" stopColor="rgba(255,200,0,0)"/>
        </radialGradient>
        <filter id="tg-drop">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.65)"/>
        </filter>
        <filter id="tg-glow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ambient outer glow */}
      <ellipse cx="50" cy="70" rx="46" ry="54" fill="url(#tg-ambient)" opacity="0.9"/>

      {/* ── BASE ─── */}
      <rect x="20" y="110" width="60" height="12" rx="5" fill="#1b6b38"/>
      <rect x="24" y="113" width="52" height="6"  rx="3" fill="#28883f"/>
      <rect x="18" y="108" width="64" height="5"  rx="2.5" fill="url(#tg-v)"/>
      <rect x="22" y="106" width="56" height="4"  rx="2" fill="url(#tg-h)" opacity="0.9"/>

      {/* ── STEM ─── */}
      <path d="M43 78 L43 106 L57 106 L57 78Z" fill="url(#tg-v)"/>
      <rect x="43" y="78" width="5" height="28" rx="1" fill="rgba(255,255,255,0.18)"/>

      {/* ── BODY — two figure arcs ─── */}
      <path
        d="M44 78
           C42 68 26 56 22 42
           C18 28 25 14 33 10
           C39 6  46 6  50 9
           C54 6  61 6  67 10
           C75 14 82 28 78 42
           C74 56 58 68 56 78Z"
        fill="url(#tg-v)"
        filter="url(#tg-drop)"
      />
      {/* right-side darker half for depth */}
      <path
        d="M50 9 C54 6 61 6 67 10 C75 14 82 28 78 42 C74 56 58 68 56 78 L50 78Z"
        fill="url(#tg-h)" opacity="0.55"
      />
      {/* figure detail lines */}
      <path d="M32 72 C20 58 17 42 24 30 C28 20 36 14 44 12"
        stroke="rgba(255,248,160,0.38)" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M68 72 C80 58 83 42 76 30 C72 20 64 14 56 12"
        stroke="rgba(255,248,160,0.38)" strokeWidth="1.6" strokeLinecap="round"/>
      {/* waist indent shadow */}
      <path d="M44 74 C44 68 47 64 50 64 C53 64 56 68 56 74"
        stroke="rgba(0,0,0,0.22)" strokeWidth="2.2" fill="none"/>

      {/* shine strip */}
      <path
        d="M32 68 C22 52 20 34 28 22 C32 14 38 10 44 9 C38 13 32 22 30 36 C28 50 32 64 38 72Z"
        fill="url(#tg-shine)" opacity="0.85"
      />

      {/* ── GLOBE ─── */}
      <circle cx="50" cy="12" r="11.5" stroke="url(#tg-v)" strokeWidth="2.5" filter="url(#tg-glow)"/>
      <ellipse cx="50" cy="12" rx="6.5" ry="11.5" stroke="rgba(255,222,80,0.55)" strokeWidth="1.2"/>
      <line x1="38.5" y1="12" x2="61.5" y2="12" stroke="rgba(255,222,80,0.55)" strokeWidth="1.2"/>
      <line x1="38.5" y1="7.2" x2="61.5" y2="7.2"  stroke="rgba(255,222,80,0.30)" strokeWidth="0.8"/>
      <line x1="38.5" y1="16.8" x2="61.5" y2="16.8" stroke="rgba(255,222,80,0.30)" strokeWidth="0.8"/>
      <line x1="50" y1="0.5" x2="50" y2="23.5" stroke="rgba(255,222,80,0.32)" strokeWidth="0.8"/>
      {/* globe shine */}
      <path d="M44 5 C44 3 47 1.5 49 1.5 A10 10 0 0 0 43 7Z" fill="rgba(255,255,255,0.28)"/>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
   SOCCER BALL — tricolor with pentagon patches
   ════════════════════════════════════════════════════════ */
function SoccerBall({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden
      className="soccer-float"
      style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,.75)) drop-shadow(0 0 24px rgba(255,255,255,.10))" }}>
      <defs>
        <clipPath id="sb2-clip"><circle cx="50" cy="50" r="46"/></clipPath>
        <radialGradient id="sb2-base" cx="38%" cy="33%" r="65%">
          <stop offset="0%"   stopColor="#1c2c48"/>
          <stop offset="100%" stopColor="#050811"/>
        </radialGradient>
        <radialGradient id="sb2-shine" cx="32%" cy="26%" r="42%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.28)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      {/* base */}
      <circle cx="50" cy="50" r="46" fill="url(#sb2-base)"/>

      {/* tricolor slices */}
      {/* green — Mexico, top-left */}
      <path d="M50 4 A46 46 0 0 0 4 50 L50 50Z"              fill="rgba(34,197,94,0.88)"  clipPath="url(#sb2-clip)"/>
      {/* white divider */}
      <path d="M4 50 L4 57 L50 50Z"                           fill="rgba(255,255,255,0.72)" clipPath="url(#sb2-clip)"/>
      {/* blue — USA, right half */}
      <path d="M50 4 L96 4 A46 46 0 0 1 96 50 L50 50Z"        fill="rgba(29,78,216,0.88)"  clipPath="url(#sb2-clip)"/>
      {/* white divider */}
      <path d="M96 50 L96 58 L50 50Z"                         fill="rgba(255,255,255,0.65)" clipPath="url(#sb2-clip)"/>
      {/* red — Canada, bottom-right */}
      <path d="M96 58 A46 46 0 0 1 50 96 L50 50Z"             fill="rgba(220,38,38,0.88)"  clipPath="url(#sb2-clip)"/>
      {/* dark — bottom-left fill */}
      <path d="M4 57 A46 46 0 0 0 50 96 L50 50Z"              fill="rgba(15,35,20,0.82)"   clipPath="url(#sb2-clip)"/>

      {/* pentagon patches overlay */}
      <polygon points="50,26 65,37 59,55 41,55 35,37"
        fill="rgba(0,0,0,0.20)" stroke="rgba(255,255,255,0.16)" strokeWidth="0.9" clipPath="url(#sb2-clip)"/>
      <polygon points="50,4 62,11 60,24 40,24 38,11"
        fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" clipPath="url(#sb2-clip)"/>
      <polygon points="74,22 84,30 80,44 66,46 62,32"
        fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" clipPath="url(#sb2-clip)"/>
      <polygon points="26,22 38,32 34,46 20,44 16,30"
        fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" clipPath="url(#sb2-clip)"/>
      <polygon points="78,58 86,70 78,82 62,80 58,66"
        fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" clipPath="url(#sb2-clip)"/>

      {/* shine + edge */}
      <circle cx="50" cy="50" r="46" fill="url(#sb2-shine)"/>
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.40)" strokeWidth="0.5"/>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
   HERO PANELS — three diagonal color bands + city skylines
   ════════════════════════════════════════════════════════ */
function HeroPanels() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>

      {/* ═══ MEXICO GREEN ═══ */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(20% 0%,50% 0%,34% 100%,2% 100%)",
        background: "linear-gradient(178deg,#1d7038 0%,#0e4020 45%,#051509 100%)",
      }}/>
      {/* atmospheric glow from city bottom */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(20% 0%,50% 0%,34% 100%,2% 100%)",
        background: "radial-gradient(ellipse 85% 35% at 28% 92%,rgba(255,200,90,.20) 0%,transparent 70%)",
      }}/>
      {/* Mexico City skyline */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(20% 0%,50% 0%,34% 100%,2% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <defs>
            <radialGradient id="grd-mx" cx="40%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="rgba(255,190,60,.16)"/>
              <stop offset="100%" stopColor="rgba(255,190,60,0)"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="580" fill="url(#grd-mx)"/>
          {/* Angel column */}
          <rect x="316" y="178" width="11" height="318" fill="rgba(245,255,220,.50)"/>
          {/* column base */}
          <rect x="305" y="482" width="33" height="20" rx="2" fill="rgba(245,255,220,.44)"/>
          <rect x="300" y="498" width="43" height="9"  rx="2" fill="rgba(245,255,220,.38)"/>
          {/* Angel body */}
          <ellipse cx="322" cy="172" rx="11" ry="15" fill="rgba(245,255,220,.56)"/>
          {/* wings */}
          <path d="M322 178 L276 150 L304 178Z" fill="rgba(245,255,220,.44)"/>
          <path d="M322 178 L368 150 L340 178Z" fill="rgba(245,255,220,.44)"/>
          {/* raised arm */}
          <path d="M322 164 L331 143 L335 146" stroke="rgba(245,255,220,.60)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          {/* city buildings */}
          <rect x="236" y="418" width="30" height="82" fill="rgba(245,255,220,.26)"/>
          <rect x="270" y="404" width="22" height="96" fill="rgba(245,255,220,.22)"/>
          <rect x="354" y="428" width="26" height="72" fill="rgba(245,255,220,.20)"/>
          <rect x="384" y="440" width="20" height="60" fill="rgba(245,255,220,.17)"/>
          <rect x="292" y="448" width="18" height="52" fill="rgba(245,255,220,.16)"/>
          <rect x="402" y="452" width="24" height="48" fill="rgba(245,255,220,.15)"/>
          <rect x="208" y="438" width="26" height="62" fill="rgba(245,255,220,.18)"/>
          <rect x="424" y="460" width="18" height="40" fill="rgba(245,255,220,.13)"/>
          {/* ground glow */}
          <ellipse cx="320" cy="540" rx="110" ry="26" fill="rgba(255,200,80,.10)"/>
        </svg>
      </div>

      {/* ═══ DIVIDER 1 (white) ═══ */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(50% 0%,54.5% 0%,38.5% 100%,34% 100%)",
        background: "linear-gradient(178deg,rgba(255,255,255,.75) 0%,rgba(255,255,255,.18) 100%)",
      }}/>

      {/* ═══ USA BLUE ═══ */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(54.5% 0%,79% 0%,63% 100%,38.5% 100%)",
        background: "linear-gradient(178deg,#0e2472 0%,#071848 45%,#020a20 100%)",
      }}/>
      {/* atmospheric glow */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(54.5% 0%,79% 0%,63% 100%,38.5% 100%)",
        background: "radial-gradient(ellipse 85% 35% at 63% 92%,rgba(90,150,255,.18) 0%,transparent 70%)",
      }}/>
      {/* NYC skyline */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(54.5% 0%,79% 0%,63% 100%,38.5% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <defs>
            <radialGradient id="grd-nyc" cx="50%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="rgba(90,140,255,.16)"/>
              <stop offset="100%" stopColor="rgba(90,140,255,0)"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="580" fill="url(#grd-nyc)"/>
          {/* One WTC */}
          <polygon points="480,26 486,0 506,26 502,488" fill="rgba(200,220,255,.55)"/>
          <line x1="493" y1="0" x2="493" y2="-55" stroke="rgba(200,220,255,.65)" strokeWidth="2.5"/>
          <rect x="470" y="488" width="48" height="14" rx="2" fill="rgba(200,220,255,.38)"/>
          {/* WTC windows */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <rect key={i} x="486" y={46+i*48} width="12" height="7" rx="1" fill="rgba(255,238,180,.20)"/>
          ))}
          {/* Empire State */}
          <rect x="426" y="158" width="24" height="322" fill="rgba(200,220,255,.38)"/>
          <rect x="430" y="136" width="16" height="24" fill="rgba(200,220,255,.44)"/>
          <line x1="438" y1="96" x2="438" y2="138" stroke="rgba(200,220,255,.56)" strokeWidth="3.2"/>
          {/* other buildings */}
          <rect x="538" y="298" width="32" height="190" fill="rgba(200,220,255,.30)"/>
          <rect x="572" y="338" width="24" height="152" fill="rgba(200,220,255,.24)"/>
          <rect x="598" y="378" width="20" height="112" fill="rgba(200,220,255,.20)"/>
          <rect x="396" y="358" width="28" height="130" fill="rgba(200,220,255,.24)"/>
          <rect x="366" y="398" width="28" height="92"  fill="rgba(200,220,255,.20)"/>
          <rect x="338" y="418" width="26" height="72"  fill="rgba(200,220,255,.17)"/>
          {/* ground glow */}
          <ellipse cx="490" cy="540" rx="120" ry="26" fill="rgba(150,190,255,.10)"/>
        </svg>
      </div>

      {/* ═══ DIVIDER 2 (white) ═══ */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(79% 0%,83.5% 0%,67.5% 100%,63% 100%)",
        background: "linear-gradient(178deg,rgba(255,255,255,.70) 0%,rgba(255,255,255,.14) 100%)",
      }}/>

      {/* ═══ CANADA RED ═══ */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(83.5% 0%,100% 0%,100% 100%,67.5% 100%)",
        background: "linear-gradient(178deg,#8c1010 0%,#541010 45%,#220404 100%)",
      }}/>
      {/* atmospheric glow */}
      <div className="absolute inset-0" style={{
        clipPath: "polygon(83.5% 0%,100% 0%,100% 100%,67.5% 100%)",
        background: "radial-gradient(ellipse 85% 35% at 88% 92%,rgba(255,120,120,.18) 0%,transparent 70%)",
      }}/>
      {/* Toronto skyline */}
      <div className="absolute inset-0" style={{ clipPath: "polygon(83.5% 0%,100% 0%,100% 100%,67.5% 100%)" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 580" preserveAspectRatio="none">
          <defs>
            <radialGradient id="grd-tor" cx="50%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="rgba(255,100,100,.16)"/>
              <stop offset="100%" stopColor="rgba(255,100,100,0)"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="580" fill="url(#grd-tor)"/>
          {/* CN Tower shaft */}
          <polygon points="643,0 646,0 653,488 636,488" fill="rgba(255,205,205,.54)"/>
          {/* pod */}
          <ellipse cx="645" cy="272" rx="24" ry="11" fill="rgba(255,205,205,.60)"/>
          <rect x="636" y="264" width="18" height="16" rx="5" fill="rgba(255,205,205,.55)"/>
          <rect x="638" y="266" width="14" height="4"  rx="1" fill="rgba(255,240,200,.38)"/>
          {/* pod glow */}
          <ellipse cx="645" cy="272" rx="40" ry="18" fill="rgba(255,100,80,.14)"/>
          {/* spire */}
          <line x1="645" y1="0" x2="645" y2="-38" stroke="rgba(255,205,205,.68)" strokeWidth="2"/>
          {/* Toronto buildings */}
          <rect x="676" y="255" width="30" height="233" fill="rgba(255,205,205,.32)"/>
          <rect x="708" y="296" width="24" height="192" fill="rgba(255,205,205,.26)"/>
          <rect x="734" y="336" width="20" height="152" fill="rgba(255,205,205,.22)"/>
          <rect x="756" y="376" width="18" height="112" fill="rgba(255,205,205,.18)"/>
          <rect x="776" y="416" width="24" height="72"  fill="rgba(255,205,205,.16)"/>
          <rect x="612" y="376" width="22" height="112" fill="rgba(255,205,205,.22)"/>
          <rect x="588" y="398" width="22" height="90"  fill="rgba(255,205,205,.18)"/>
          {/* ground glow */}
          <ellipse cx="690" cy="540" rx="110" ry="26" fill="rgba(255,130,130,.10)"/>
        </svg>
      </div>

      {/* ═══ BLEND: left dark → panels ═══ */}
      <div className="absolute inset-0" style={{
        background:
          "linear-gradient(90deg," +
          "#080c18 0%,#080c18 6%," +
          "rgba(8,12,24,.96) 16%," +
          "rgba(8,12,24,.68) 26%," +
          "rgba(8,12,24,.22) 40%," +
          "transparent 56%)",
      }}/>
      {/* bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-28" style={{ background: "linear-gradient(to top,#080c18,transparent)" }}/>
      {/* top fade */}
      <div className="absolute top-0 inset-x-0 h-10"   style={{ background: "linear-gradient(to bottom,rgba(8,12,24,.35),transparent)" }}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FEATURE CARDS
   ════════════════════════════════════════════════════════ */
const features = [
  { icon: Target,     title: "Predicciones",   desc: "Pronostica cada partido antes que empiece. Gana hasta 5 pts por marcador exacto.", href: "/predictions", className: "card-blue",    iconColor: "text-[hsl(var(--brand-blue-light))]", iconBg: "bg-[hsl(var(--brand-blue)/0.2)]",    accent: "#1D4ED8" },
  { icon: BarChart3,  title: "Ranking en vivo", desc: "Actualización en tiempo real. Compite en el leaderboard global del Mundial.",     href: "/rankings",    className: "card-gold",    iconColor: "text-[hsl(var(--brand-gold))]",       iconBg: "bg-[hsl(var(--brand-gold)/0.18)]",   accent: "#F5A500" },
  { icon: Globe2,     title: "Selecciones",     desc: "Plantillas, estadísticas históricas y formaciones de las 48 selecciones.",        href: "/selecciones", className: "card-emerald", iconColor: "text-emerald-400",                    iconBg: "bg-[rgba(16,185,129,0.15)]",         accent: "#10B981" },
  { icon: ShieldCheck,title: "Estadísticas",    desc: "Datos históricos desde 1930. Récords mundiales, goleadores y más.",              href: "/estadisticas",className: "card-violet",  iconColor: "text-violet-400",                     iconBg: "bg-[rgba(139,92,246,0.15)]",         accent: "#8B5CF6" },
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
      <section className="hero-2026 relative overflow-hidden min-h-[540px] md:min-h-[600px] lg:min-h-[640px]">

        {/* solid dark base */}
        <div className="absolute inset-0 bg-[#080c18]"/>

        {/* diagonal colored panels — hidden on mobile */}
        <div className="hidden sm:block">
          <HeroPanels/>
        </div>
        {/* mobile: simple gradient bg */}
        <div className="absolute inset-0 sm:hidden" style={{
          background:
            "radial-gradient(ellipse 80% 60% at -10% 30%,rgba(22,92,46,.32) 0%,transparent 55%)," +
            "radial-gradient(ellipse 60% 50% at 110% 70%,rgba(220,38,38,.18) 0%,transparent 55%)," +
            "radial-gradient(ellipse 70% 60% at 110% 20%,rgba(29,78,216,.22) 0%,transparent 55%)",
        }}/>

        {/* ── CONTENT ── */}
        <div className="relative z-10 max-w-[1400px] mx-auto w-full h-full">
          {/* flex row on desktop */}
          <div className="flex flex-col md:flex-row items-center md:items-stretch min-h-[540px] md:min-h-[600px]">

            {/* ── LEFT: text ── */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-10 lg:px-14 py-14 md:py-0 text-center md:text-left order-2 md:order-1 md:max-w-[48%]">

              {/* badge */}
              <motion.div
                initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-bold mb-5 border border-[hsl(var(--brand-blue)/0.3)] text-[hsl(var(--brand-blue-light))] self-center md:self-start"
              >
                <Star className="h-3 w-3 fill-current"/>
                OFFICIAL PREDICTION PLATFORM
                <Star className="h-3 w-3 fill-current"/>
              </motion.div>

              {/* label */}
              <motion.p
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.10 }}
                className="text-xs md:text-sm font-bold tracking-[0.34em] uppercase text-white/42 mb-1.5"
              >
                FIFA WORLD CUP
              </motion.p>

              {/* 2026 */}
              <motion.div
                initial={{ opacity:0, scale:.86 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay:.14, duration:.55, type:"spring", stiffness:90 }}
                className="flex items-baseline justify-center md:justify-start leading-none mb-4"
              >
                <span className="font-black tracking-tighter select-none"
                  style={{
                    fontSize:"clamp(6.5rem,22vw,14.5rem)",
                    color:"#ffffff",
                    textShadow:"0 0 80px rgba(255,255,255,.14),0 4px 32px rgba(0,0,0,.8)",
                  }}>20</span>
                <span className="font-black tracking-tighter select-none"
                  style={{
                    fontSize:"clamp(6.5rem,22vw,14.5rem)",
                    color:"#4ade80",
                    textShadow:"0 0 80px rgba(74,222,128,.60),0 4px 32px rgba(0,0,0,.8)",
                    filter:"drop-shadow(0 0 44px rgba(74,222,128,.50))",
                  }}>26</span>
              </motion.div>

              {/* host nations */}
              <motion.div
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.24 }}
                className="flex items-center gap-3 justify-center md:justify-start mb-4 font-black tracking-widest text-sm md:text-base"
              >
                <span style={{ color:"#4ade80" }}>MÉXICO</span>
                <span className="text-white/22">•</span>
                <span className="text-white">USA</span>
                <span className="text-white/22">•</span>
                <span style={{ color:"#f87171" }}>CANADÁ</span>
              </motion.div>

              {/* slogan */}
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.30 }}
                className="flex items-center gap-3 justify-center md:justify-start mb-3"
              >
                <div className="h-px w-9 bg-gradient-to-r from-transparent to-[#4ade80]"/>
                <p className="text-xs font-bold tracking-[0.22em] text-white/58">JUEGA · PRONOSTICA · GANA</p>
                <div className="h-px w-9 bg-gradient-to-l from-transparent to-[#f87171]"/>
              </motion.div>

              {/* QUINIELA */}
              <motion.p
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.33 }}
                className="text-xs font-black tracking-[0.50em] mb-8 text-center md:text-left"
                style={{ color:"#4ade80" }}
              >── QUINIELA ──</motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.40 }}
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

            {/* ── RIGHT: soccer ball + trophy ── */}
            <div className="order-1 md:order-2 relative flex items-center justify-center gap-6 md:gap-0 py-10 md:py-0 md:flex-1">

              {/* Soccer ball — centered at left edge of panels */}
              <motion.div
                initial={{ opacity:0, x:24, rotate:-12 }}
                animate={{ opacity:1, x:0,  rotate:0   }}
                transition={{ delay:.18, duration:.65, type:"spring", stiffness:72 }}
                className="relative z-20 md:absolute md:left-[-8%] lg:left-[-4%] md:top-1/2 md:-translate-y-1/2"
              >
                <SoccerBall size={148}/>
              </motion.div>

              {/* FIFA trophy — right-aligned, large, inside red panel */}
              <motion.div
                initial={{ opacity:0, scale:.72, y:20 }}
                animate={{ opacity:1, scale:1,   y:0  }}
                transition={{ delay:.22, duration:.70, type:"spring", stiffness:75 }}
                className="relative z-10 md:absolute md:right-2 lg:right-6 md:bottom-0 flex flex-col items-center"
              >
                {/* golden spotlight behind trophy */}
                <div className="absolute rounded-full" style={{
                  inset:"-60%",
                  background:"radial-gradient(circle,rgba(245,165,0,.28) 0%,transparent 65%)",
                  animation:"pulse-glow 3s ease-in-out infinite",
                }}/>
                {/* halo rings */}
                <div className="absolute inset-6 rounded-full border border-[rgba(245,165,0,.22)]"
                  style={{ animation:"pulse-glow 3s ease-in-out infinite" }}/>
                <div className="absolute inset-12 rounded-full border border-[rgba(245,165,0,.12)]"
                  style={{ animation:"pulse-glow 3s ease-in-out infinite .9s" }}/>

                <div className="relative z-10 trophy-spin-3d" style={{ perspective:"700px" }}>
                  <FIFATrophy size={170}/>
                </div>
              </motion.div>
            </div>
          </div>

          {/* stats strip */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.52 }}
            className="grid grid-cols-3 md:grid-cols-6 gap-2.5 px-5 md:px-10 lg:px-14 pb-10"
          >
            {stats.map(s => (
              <div key={s.label} className="stat-pill p-3 text-center rounded-2xl">
                <div className="text-lg md:text-2xl font-black text-gradient-gold">{s.value}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <div className="relative max-w-6xl mx-auto px-4">
        <section className="pb-20 pt-8">
          <motion.h2
            initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
            className="text-center text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground mb-8"
          >TODO LO QUE NECESITAS</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f,i) => (
              <motion.div key={f.title}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.08 }}
              >
                <Link href={f.href}
                  className={`relative rounded-2xl p-5 ${f.className} overflow-hidden block group transition-all hover:-translate-y-1.5 duration-200`}
                  style={{ boxShadow:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 32px ${f.accent}22`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow="none"; }}
                >
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
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="glass-card rounded-3xl p-8 border border-[hsl(var(--brand-gold)/0.15)]"
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Zap className="h-5 w-5 text-[hsl(var(--brand-gold))]"/>
              <h2 className="text-base font-bold tracking-wide">SISTEMA DE PUNTOS</h2>
            </div>
            <div className="space-y-4">
              {[
                { pts:5, label:"Marcador exacto + ganador", pct:"100%", color:"#F5A500" },
                { pts:3, label:"Ganador correcto",          pct:"60%",  color:"#1D4ED8" },
                { pts:2, label:"Empate exacto",             pct:"40%",  color:"#60A5FA" },
                { pts:1, label:"Empate (resultado correcto)",pct:"20%", color:"#94a3b8" },
                { pts:0, label:"Predicción incorrecta",      pct:"0%",  color:"#475569" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-4">
                  <span className="text-2xl font-black tabular-nums w-6 shrink-0" style={{ color:s.color }}>{s.pts}</span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:s.pct, background:s.color }}/>
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
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="max-w-xl mx-auto"
          >
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
