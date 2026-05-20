"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants";

export function useRealtimeMatches(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`matches:${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `tournament_id=eq.${tournamentId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.matches, tournamentId] });
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [tournamentId, queryClient]);
}
