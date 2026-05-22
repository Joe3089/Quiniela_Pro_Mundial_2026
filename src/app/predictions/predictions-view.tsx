"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lock, CheckCircle2, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/features/fixtures/components/match-card";
import { PredictionForm } from "@/features/predictions/components/prediction-form";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import type { Match } from "@/types/fixtures";
import { cn } from "@/lib/utils";

function PredictionMatchRow({
  match,
  prediction,
}: {
  match: Match;
  prediction?: { home: number; away: number } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLocked = match.status !== "scheduled" || new Date(match.match_date) <= new Date();

  return (
    <div className="glass rounded-xl border border-border/40 overflow-hidden">
      <div
        className={cn("cursor-pointer", !isLocked && "hover:bg-muted/10 transition-colors")}
        onClick={() => !isLocked && setExpanded(!expanded)}
      >
        <MatchCard
          match={match}
          showPrediction={!!prediction}
          prediction={prediction}
          compact
        />
        {isLocked && (
          <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Predicciones cerradas</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/30 overflow-hidden"
          >
            <div className="p-4">
              <PredictionForm
                match={match}
                existingPrediction={null}
                onSuccess={() => setExpanded(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PredictionsView() {
  const { data: allMatches, isLoading: matchesLoading } = useMatches();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();

  const predictionMap = new Map(
    predictions?.map((p) => [
      p.match_id,
      { home: p.home_score_prediction, away: p.away_score_prediction },
    ])
  );

  const open = allMatches?.filter(
    (m) => m.status === "scheduled" && new Date(m.match_date) > new Date()
  ) ?? [];

  const withPrediction = allMatches?.filter((m) => predictionMap.has(m.id)) ?? [];
  const finished = allMatches?.filter((m) => m.status === "finished") ?? [];

  const isLoading = matchesLoading || predsLoading;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
            <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
          Mis <span className="text-gradient-vivid ml-1">Predicciones</span>
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{predictions?.length ?? 0} guardadas</Badge>
          {open.length > 0 && (
            <Badge variant="warning">{open.filter((m) => !predictionMap.has(m.id)).length} pendientes</Badge>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="open">
        <TabsList className="mb-4 glass border border-border/30">
          <TabsTrigger value="open" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Abiertas ({open.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Guardadas ({withPrediction.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Finalizadas ({finished.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : open.length > 0 ? (
            <div className="space-y-2">
              {open.map((match) => (
                <PredictionMatchRow
                  key={match.id}
                  match={match}
                  prediction={predictionMap.get(match.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No hay partidos abiertos para predecir</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <div className="space-y-2">
            {withPrediction.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showPrediction
                prediction={predictionMap.get(match.id)}
              />
            ))}
            {withPrediction.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Aún no tienes predicciones guardadas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished">
          <div className="space-y-2">
            {finished.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {finished.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay partidos finalizados aún</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
