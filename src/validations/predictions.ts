import { z } from "zod";

const scoreInt = z.number().min(0).max(20).int().nullable().optional();

export const predictionSchema = z.object({
  home_score_prediction: z
    .number({ error: "Requerido" })
    .min(0, { message: "Mínimo 0" })
    .max(20, { message: "Máximo 20" })
    .int({ message: "Número entero" }),
  away_score_prediction: z
    .number({ error: "Requerido" })
    .min(0, { message: "Mínimo 0" })
    .max(20, { message: "Máximo 20" })
    .int({ message: "Número entero" }),
  outcome_prediction: z.enum(["90min", "extra_time", "penalties"]).nullable().optional(),
  qualifier_team_id: z.string().nullable().optional(),
  extra_time_home_prediction: scoreInt,
  extra_time_away_prediction: scoreInt,
  penalties_home_prediction: scoreInt,
  penalties_away_prediction: scoreInt,
});

export type PredictionInput = z.infer<typeof predictionSchema>;
