import type { Metadata } from "next";
import { Leaderboard } from "@/features/rankings/components/leaderboard";
import { PodiumReveal } from "@/features/rankings/components/podium-reveal";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[hsl(var(--brand-blue)/0.18)] flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-[hsl(var(--brand-blue-light))]" />
          </div>
          <span className="text-gradient-vivid">Ranking</span>
          <span>Global</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Actualización en tiempo real · Mundial 2026
        </p>
      </div>
      <Leaderboard />
      <PodiumReveal />
    </div>
  );
}
