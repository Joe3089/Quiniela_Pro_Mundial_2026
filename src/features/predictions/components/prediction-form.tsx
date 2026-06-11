"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, CheckCircle2 } from "lucide-react";
import { predictionSchema, type PredictionInput } from "@/validations/predictions";
import { useSavePrediction } from "../hooks/use-predictions";
import { Button } from "@/components/ui/button";
import type { Match } from "@/types/fixtures";
import type { Prediction } from "@/types/predictions";
import { cn } from "@/lib/utils";

interface PredictionFormProps {
  match: Match;
  existingPrediction?: Prediction | null;
  onSuccess?: () => void;
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="text-2xl font-bold tabular-nums w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled || value >= 20}
        className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export function PredictionForm({ match, existingPrediction, onSuccess }: PredictionFormProps) {
  const save = useSavePrediction();
  const isLocked = match.status !== "scheduled";
  const isBeforeLockout = false; // predictions open until kickoff

  const { watch, setValue, handleSubmit } = useForm<PredictionInput>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      home_score_prediction: existingPrediction?.home_score_prediction ?? 0,
      away_score_prediction: existingPrediction?.away_score_prediction ?? 0,
    },
  });

  const homeScore = watch("home_score_prediction");
  const awayScore = watch("away_score_prediction");

  const disabled = isLocked || isBeforeLockout;

  const onSubmit = (data: PredictionInput) => {
    if (disabled) return;
    save.mutate({ matchId: match.id, data }, { onSuccess });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.home_team?.flag_url && (
            <Image
              src={match.home_team.flag_url}
              alt={match.home_team.name}
              width={40}
              height={28}
              className="rounded-md object-cover"
            />
          )}
          <span className="text-sm font-semibold">
            {match.home_team?.short_name ?? "TBD"}
          </span>
          <ScoreInput
            value={homeScore}
            onChange={(v) => setValue("home_score_prediction", v)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl text-muted-foreground font-bold">—</span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.away_team?.flag_url && (
            <Image
              src={match.away_team.flag_url}
              alt={match.away_team.name}
              width={40}
              height={28}
              className="rounded-md object-cover"
            />
          )}
          <span className="text-sm font-semibold">
            {match.away_team?.short_name ?? "TBD"}
          </span>
          <ScoreInput
            value={awayScore}
            onChange={(v) => setValue("away_score_prediction", v)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Points preview */}
      <div className="glass rounded-lg p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Posibles puntos:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Exacto:</span>
          <span className="text-xs font-bold text-primary">5 pts</span>
          <span className="text-xs text-muted-foreground">Ganador:</span>
          <span className="text-xs font-bold text-accent">3 pts</span>
        </div>
      </div>

      <AnimatePresence>
        {existingPrediction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-green-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Predicción guardada: {existingPrediction.home_score_prediction} - {existingPrediction.away_score_prediction}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {disabled ? (
        <div className={cn("text-center text-xs py-2 rounded-lg", isLocked ? "text-red-400 bg-red-500/10" : "text-yellow-500/80 bg-yellow-500/10")}>
          {isLocked ? "Partido en curso o finalizado" : "Cerrado · Menos de 2h para el partido"}
        </div>
      ) : (
        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          loading={save.isPending}
        >
          {existingPrediction ? "Actualizar predicción" : "Guardar predicción"}
        </Button>
      )}
    </motion.form>
  );
}
