import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TournamentRow } from "@/types/database";

interface TournamentStore {
  activeTournament: TournamentRow | null;
  setActiveTournament: (tournament: TournamentRow | null) => void;
}

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    (set) => ({
      activeTournament: null,
      setActiveTournament: (tournament) =>
        set({ activeTournament: tournament }, false, "tournament/setActive"),
    }),
    { name: "TournamentStore" }
  )
);
