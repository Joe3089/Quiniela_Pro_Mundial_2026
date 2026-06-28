"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, CheckCircle2, Check } from "lucide-react";
import { predictionSchema, type PredictionInput } from "@/validations/predictions";
import { useSavePrediction } from "../hooks/use-predictions";
import { Button } from "@/components/ui/button";
import type { Match } from "@/types/fixtures";
import type { Prediction } from "@/types/predictions";
import { cn } from "@/lib/utils";

const GROUP_PHASES = ["group"] as const;
const isKnockout = (phase: string) => !(GROUP_PHASES as readonly string[]).includes(phase);

const OUTCOME_OPTIONS = [
  { value: "90min",      label: "90 min",    desc: "Gana en tiempo regular" },
  { value: "extra_time", label: "Prórroga",  desc: "Se define en tiempo extra" },
  { value: "penalties",  label: "Penales",   desc: "Se define en tanda de penales" },
] as const;

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
  const knockout = isKnockout(match.phase);

  const { watch, setValue, handleSubmit } = useForm<PredictionInput>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      home_score_prediction: existingPrediction?.home_score_prediction ?? 0,
      away_score_prediction: existingPrediction?.away_score_prediction ?? 0,
      outcome_prediction: (existingPrediction as { outcome_prediction?: PredictionInput["outcome_prediction"] })?.outcome_prediction ?? "90min",
      qualifier_team_id: (existingPrediction as { qualifier_team_id?: string | null })?.qualifier_team_id ?? null,
    },
  });

  const homeScore = watch("home_score_prediction");
  const awayScore = watch("away_score_prediction");
  const outcome   = watch("outcome_prediction");
  const qualifier = watch("qualifier_team_id");

  const onSubmit = (data: PredictionInput) => {
    if (isLocked) return;
    save.mutate({ matchId: match.id, data }, { onSuccess });
  };

  const homeId = match.home_team?.id ?? "";
  const awayId = match.away_team?.id ?? "";

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Score row */}
      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.home_team?.flag_url && (
            <Image src={match.home_team.flag_url} alt={match.home_team.name} width={40} height={28} className="rounded-md object-cover" />
          )}
          <span className="text-sm font-semibold">{match.home_team?.short_name ?? "TBD"}</span>
          <ScoreInput value={homeScore} onChange={(v) => setValue("home_score_prediction", v)} disabled={isLocked} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl text-muted-foreground font-bold">—</span>
        </div>
        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.away_team?.flag_url && (
            <Image src={match.away_team.flag_url} alt={match.away_team.name} width={40} height={28} className="rounded-md object-cover" />
          )}
          <span className="text-sm font-semibold">{match.away_team?.short_name ?? "TBD"}</span>
          <ScoreInput value={awayScore} onChange={(v) => setValue("away_score_prediction", v)} disabled={isLocked} />
        </div>
      </div>

      {/* Knockout extra fields */}
      {knockout && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            {/* Outcome selector */}
            <div className="glass rounded-lg p-3 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">¿Cómo termina?</span>
              <div className="grid grid-cols-3 gap-1.5">
                {OUTCOME_OPTIONS.map((opt) => {
                  const sel = outcome === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setValue("outcome_prediction", opt.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-center border-2 transition-all active:scale-95",
                        sel
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.25)]"
                          : "border-border/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/20",
                        isLocked && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {sel && <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                      <span className="text-[11px] font-bold">{opt.label}</span>
                      <span className="text-[9px] opacity-70 leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qualifier selector */}
            {(match.home_team || match.away_team) && (
              <div className="glass rounded-lg p-3 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">¿Quién clasifica?</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: homeId, team: match.home_team },
                    { id: awayId, team: match.away_team },
                  ].map(({ id, team }) => {
                    const sel = qualifier === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={isLocked || !id}
                        onClick={() => setValue("qualifier_team_id", sel ? null : id)}
                        className={cn(
                          "relative flex items-center gap-2 rounded-lg px-3 py-2.5 border-2 transition-all active:scale-95",
                          sel
                            ? "border-primary bg-primary/15 shadow-[0_0_10px_rgba(var(--primary-rgb),0.25)]"
                            : "border-border/40 hover:border-primary/50 hover:bg-muted/20",
                          (isLocked || !id) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {sel && <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                        {team?.flag_url && (
                          <Image src={team.flag_url} alt={team.name} width={22} height={15} className="rounded-sm object-cover shrink-0" />
                        )}
                        <span className={cn("text-[11px] font-semibold truncate", sel ? "text-primary" : "text-muted-foreground")}>
                          {team?.short_name ?? "TBD"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Points preview */}
      <div className="glass rounded-lg p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Puntos posibles:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Exacto:</span>
          <span className="text-xs font-bold text-primary">5 pts</span>
          {knockout && (
            <>
              <span className="text-xs text-muted-foreground">Penales+:</span>
              <span className="text-xs font-bold text-accent">4 pts</span>
            </>
          )}
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
            <span>Guardado: {existingPrediction.home_score_prediction} - {existingPrediction.away_score_prediction}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isLocked ? (
        <div className="text-center text-xs py-2 rounded-lg text-red-400 bg-red-500/10">
          Partido en curso o finalizado
        </div>
      ) : (
        <Button type="submit" variant="gradient" className="w-full" loading={save.isPending}>
          {existingPrediction ? "Actualizar predicción" : "Guardar predicción"}
        </Button>
      )}
    </motion.form>
  );
}
