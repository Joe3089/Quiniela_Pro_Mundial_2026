import { z } from "zod";

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
});

export type PredictionInput = z.infer<typeof predictionSchema>;
