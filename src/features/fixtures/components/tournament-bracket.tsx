"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn, formatDateShort } from "@/lib/utils";
import type { BracketRound, BracketMatch } from "@/types/fixtures";

const ROUND_WIDTHS: Record<string, number> = {
  round_of_32: 160,
  round_of_16: 160,
  quarter_final: 160,
  semi_final: 160,
  third_place: 160,
  final: 180,
};

interface BracketMatchCardProps {
  match: BracketMatch;
  isWinner?: (teamId: string) => boolean;
}

function BracketMatchCard({ match, isWinner }: BracketMatchCardProps) {
  const hasScore =
    match.home_score !== null && match.away_score !== null;
  const isLive = match.status === "live";

  const renderTeam = (
    team: BracketMatch["home_team"],
    score: number | null,
    isHome: boolean
  ) => {
    const won =
      hasScore &&
      ((isHome && (match.home_score ?? 0) > (match.away_score ?? 0)) ||
        (!isHome && (match.away_score ?? 0) > (match.home_score ?? 0)));

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
          won && "bg-primary/10",
          !team && "opacity-40"
        )}
      >
        {team?.flag_url ? (
          <Image
            src={team.flag_url}
            alt={team.name}
            width={20}
            height={14}
            className="rounded-sm object-cover shrink-0"
          />
        ) : (
          <div className="w-5 h-3.5 rounded-sm bg-muted/40 shrink-0" />
        )}
        <span
          className={cn(
            "text-xs font-medium flex-1 truncate",
            won ? "text-foreground font-bold" : "text-muted-foreground",
            !team && "italic"
          )}
        >
          {team?.short_name ?? "TBD"}
        </span>
        {hasScore && (
          <span
            className={cn(
              "text-xs font-bold tabular-nums w-4 text-right",
              won ? "text-primary" : "text-muted-foreground",
              isLive && "text-red-400"
            )}
          >
            {score}
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "glass rounded-xl border overflow-hidden w-40",
        isLive ? "border-red-500/40" : "border-border/40",
        match.status === "finished" && "border-border/20"
      )}
    >
      {match.match_date && (
        <div className="px-3 py-1 bg-muted/30 border-b border-border/30">
          <span className="text-[10px] text-muted-foreground">
            {formatDateShort(match.match_date)}
          </span>
          {isLive && (
            <span className="ml-2 text-[10px] text-red-400 font-bold animate-pulse">● LIVE</span>
          )}
        </div>
      )}
      <div className="divide-y divide-border/20">
        {renderTeam(match.home_team, match.home_score, true)}
        {renderTeam(match.away_team, match.away_score, false)}
      </div>
    </motion.div>
  );
}

interface ConnectorProps {
  count: number;
  isFirst?: boolean;
}

function BracketConnectors({ count }: ConnectorProps) {
  return (
    <div className="flex flex-col justify-around" style={{ width: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center" style={{ height: 88 }}>
          <svg width="24" height="88" viewBox="0 0 24 88" fill="none">
            <path
              d="M 0 22 H 12 V 66 H 24"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              strokeDasharray="none"
              fill="none"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

interface TournamentBracketProps {
  rounds: BracketRound[];
  champion?: { name: string; flag_url?: string | null } | null;
}

export function TournamentBracket({ rounds, champion }: TournamentBracketProps) {
  const knockoutRounds = rounds.filter((r) => r.phase !== "group");
  const thirdPlace = knockoutRounds.find((r) => r.phase === "third_place");
  const mainRounds = knockoutRounds.filter((r) => r.phase !== "third_place");

  return (
    <div className="overflow-x-auto scrollbar-hide pb-8">
      <div className="flex items-start gap-0 min-w-max px-4">
        {mainRounds.map((round, roundIdx) => {
          const isLast = roundIdx === mainRounds.length - 1;
          const matchCount = round.matches.length;

          return (
            <div key={round.phase} className="flex items-center">
              {/* Round column */}
              <div className="flex flex-col">
                {/* Round label */}
                <div className="text-center mb-4 px-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {round.label}
                  </span>
                </div>

                {/* Matches */}
                <div
                  className="flex flex-col justify-around"
                  style={{
                    gap: roundIdx === 0 ? 8 : roundIdx === 1 ? 88 : roundIdx === 2 ? 176 : 352,
                  }}
                >
                  {round.matches.map((match) => (
                    <BracketMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>

              {/* Connector lines between rounds */}
              {!isLast && matchCount > 1 && (
                <BracketConnectors count={matchCount / 2} />
              )}

              {/* Final trophy */}
              {isLast && champion && (
                <div className="ml-4 flex flex-col items-center justify-center gap-2">
                  <div className="text-3xl">🏆</div>
                  <div className="flex items-center gap-2 glass rounded-xl px-4 py-2 border border-yellow-500/30">
                    {champion.flag_url && (
                      <Image
                        src={champion.flag_url}
                        alt={champion.name}
                        width={24}
                        height={16}
                        className="rounded-sm"
                      />
                    )}
                    <span className="text-sm font-bold text-gradient-gold">
                      {champion.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Third place match */}
      {thirdPlace && (
        <div className="mt-8 px-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            3er Lugar
          </div>
          <div className="flex gap-3">
            {thirdPlace.matches.map((match) => (
              <BracketMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
