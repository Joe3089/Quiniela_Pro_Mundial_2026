import Link from "next/link";
import { Trophy, Target, BarChart3, Zap, Users, Globe, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated blobs */}
      <div className="blob blob-red w-[600px] h-[600px] -top-32 -left-48 opacity-60" />
      <div className="blob blob-purple w-[500px] h-[500px] top-1/2 -right-40 opacity-50" />
      <div className="blob blob-lime w-[300px] h-[300px] bottom-0 left-1/3 opacity-40" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">

        {/* Pill badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold border border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))]">
            <Star className="h-3 w-3 fill-current" />
            FIFA World Cup 2026 · USA · Canada · México
            <Star className="h-3 w-3 fill-current" />
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          {/* Logo centered */}
          <div className="flex justify-center mb-8">
            <Logo size="xl" variant="full" href="/" />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.05]">
            <span className="block text-white">La quiniela</span>
            <span className="block text-gradient-vivid">más premium</span>
            <span className="block text-gradient-gold">del Mundial</span>
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Compite con amigos prediciendo cada partido. Brackets en tiempo real,
            ranking dinámico y hasta <strong className="text-white">5 puntos</strong> por marcador exacto.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              asChild
              className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--brand-purple))] text-white shadow-lg glow-red hover:opacity-90 active:scale-[0.98] font-bold"
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
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-16 max-w-lg mx-auto text-center">
          {[
            { value: "48", label: "Equipos" },
            { value: "104", label: "Partidos" },
            { value: "5pts", label: "Por exacto" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 border border-white/5">
              <div className="text-2xl font-black text-gradient">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: Target,
              title: "Predicciones",
              desc: "Pronostica cada partido antes que comience. Marcadores exactos, ganadores y empates.",
              color: "from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)]",
              border: "border-[hsl(var(--primary)/0.2)]",
              iconColor: "text-[hsl(var(--primary))]",
              iconBg: "bg-[hsl(var(--primary)/0.15)]",
            },
            {
              icon: BarChart3,
              title: "Ranking en vivo",
              desc: "Actualización en tiempo real. Compite con miles en el leaderboard global del Mundial.",
              color: "from-[hsl(var(--brand-violet)/0.15)] to-[hsl(var(--brand-violet)/0.05)]",
              border: "border-[hsl(var(--brand-violet)/0.2)]",
              iconColor: "text-[hsl(var(--brand-violet))]",
              iconBg: "bg-[hsl(var(--brand-violet)/0.15)]",
            },
            {
              icon: Globe,
              title: "Bracket visual",
              desc: "Visualiza el torneo completo. Fase de grupos, eliminatorias hasta la gran final.",
              color: "from-[hsl(var(--accent)/0.15)] to-[hsl(var(--accent)/0.05)]",
              border: "border-[hsl(var(--accent)/0.2)]",
              iconColor: "text-[hsl(var(--accent))]",
              iconBg: "bg-[hsl(var(--accent)/0.15)]",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`relative rounded-2xl p-6 bg-gradient-to-br ${f.color} border ${f.border} overflow-hidden group transition-transform hover:-translate-y-1 duration-200`}
            >
              <div className={`h-10 w-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Scoring system */}
        <div className="glass-card rounded-3xl p-8 mb-16 max-w-2xl mx-auto border border-white/8">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Zap className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
            <h2 className="text-lg font-bold">Sistema de puntos</h2>
          </div>
          <div className="space-y-3">
            {[
              { pts: 5, label: "Marcador exacto + ganador correcto", color: "text-[hsl(var(--primary))]", bar: "bg-[hsl(var(--primary))]", w: "w-full" },
              { pts: 3, label: "Ganador correcto", color: "text-[hsl(var(--brand-violet))]", bar: "bg-[hsl(var(--brand-violet))]", w: "w-3/5" },
              { pts: 2, label: "Empate exacto (resultado correcto)", color: "text-[hsl(var(--brand-gold))]", bar: "bg-[hsl(var(--brand-gold))]", w: "w-2/5" },
              { pts: 1, label: "Empate sin marcador exacto", color: "text-[hsl(var(--accent))]", bar: "bg-[hsl(var(--accent))]", w: "w-1/5" },
              { pts: 0, label: "Predicción incorrecta", color: "text-muted-foreground", bar: "bg-muted", w: "w-0" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className={`text-2xl font-black tabular-nums w-6 shrink-0 ${s.color}`}>
                  {s.pts}
                </span>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">{s.label}</div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar} ${s.w} transition-all`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Users className="h-4 w-4" />
            <span>Diseñado para grupos de amigos, oficinas y comunidades</span>
          </div>
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--brand-purple))] text-white font-bold hover:opacity-90"
          >
            <Link href="/auth/register">
              Empezar ahora — es gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
