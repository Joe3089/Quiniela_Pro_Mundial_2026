import Link from "next/link";
import { Trophy, Target, BarChart3, Zap, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";

export default function HomePage() {
  return (
    <div className="min-h-screen fifa-gradient relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        {/* Hero */}
        <div className="mb-4 inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-primary border border-primary/20">
          <Zap className="h-4 w-4" />
          <span>FIFA World Cup 2026 · USA · Canada · México</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
          <span className="text-gradient">Quiniela</span>
          <br />
          <span className="text-foreground">Pro Mundial</span>
          <br />
          <span className="text-gradient-gold">2026</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          La plataforma premium para competir con amigos prediciendo los resultados del mundial.
          Brackets en tiempo real, ranking dinámico y sistema de puntos profesional.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button variant="gradient" size="xl" asChild>
            <Link href="/auth/register">
              <Trophy className="h-5 w-5" />
              Unirme gratis
            </Link>
          </Button>
          <Button variant="glass" size="xl" asChild>
            <Link href="/auth/login">Ver demo</Link>
          </Button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {[
            {
              icon: Target,
              title: "Predicciones",
              desc: "Pronostica cada partido antes de que comience. Marcadores exactos, ganadores y empates.",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: BarChart3,
              title: "Ranking en vivo",
              desc: "Actualización en tiempo real. Compite con miles de jugadores en el leaderboard global.",
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              icon: Globe,
              title: "Bracket visual",
              desc: "Visualiza el torneo completo con brackets interactivos inspirados en la estética FIFA.",
              color: "text-yellow-400",
              bg: "bg-yellow-500/10",
            },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 border border-border/30 text-left">
              <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Scoring system */}
        <div className="mt-16 w-full max-w-2xl glass rounded-2xl border border-border/30 p-6">
          <h3 className="font-bold text-lg mb-4 text-center">Sistema de puntos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { pts: 5, label: "Marcador exacto + ganador", color: "text-primary" },
              { pts: 3, label: "Ganador correcto", color: "text-accent" },
              { pts: 2, label: "Empate exacto", color: "text-yellow-400" },
              { pts: 1, label: "Empate (sin marcador exacto)", color: "text-orange-400" },
              { pts: 0, label: "Predicción incorrecta", color: "text-muted-foreground" },
            ].map((s) => (
              <div key={s.pts + s.label} className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                <span className={`text-xl font-extrabold ${s.color} tabular-nums`}>
                  {s.pts}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Diseñado para grupos de amigos, oficinas y comunidades</span>
        </div>
      </div>
    </div>
  );
}
