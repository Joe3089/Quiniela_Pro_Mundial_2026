import type { Metadata } from "next";
import { PredictionsView } from "./predictions-view";

export const metadata: Metadata = { title: "Mis Predicciones" };

export default function PredictionsPage() {
  return <PredictionsView />;
}
