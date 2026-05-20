import type { Metadata } from "next";
import { FixturesView } from "./fixtures-view";

export const metadata: Metadata = { title: "Partidos y Bracket" };

export default function FixturesPage() {
  return <FixturesView />;
}
