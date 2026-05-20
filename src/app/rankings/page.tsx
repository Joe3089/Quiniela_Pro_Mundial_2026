import type { Metadata } from "next";
import { Leaderboard } from "@/features/rankings/components/leaderboard";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-gradient">Ranking</span>
          <span className="ml-1">Global</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Actualización en tiempo real · Mundial 2026
        </p>
      </div>
      <Leaderboard />
    </div>
  );
}
