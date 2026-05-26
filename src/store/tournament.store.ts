import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TournamentRow } from "@/types/database";
import { TOURNAMENT_ID, TOURNAMENT_SLUG } from "@/constants";

interface TournamentStore {
  activeTournament: TournamentRow | null;
  setActiveTournament: (tournament: TournamentRow | null) => void;
}

const DEFAULT_TOURNAMENT: TournamentRow = {
  id: TOURNAMENT_ID,
  name: "FIFA World Cup 2026",
  slug: TOURNAMENT_SLUG,
  season: "2026",
  start_date: "2026-06-11",
  end_date: "2026-07-19",
  is_active: true,
  logo_url: null,
  host_countries: ["USA", "Canada", "Mexico"],
  created_at: "2026-01-01T00:00:00.000Z",
};

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    (set) => ({
      activeTournament: DEFAULT_TOURNAMENT,
      setActiveTournament: (tournament) =>
        set({ activeTournament: tournament }, false, "tournament/setActive"),
    }),
    { name: "TournamentStore" }
  )
);
