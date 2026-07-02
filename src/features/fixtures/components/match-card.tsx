"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFormatDate } from "@/hooks/use-format-date";
import { TeamCrest } from "@/components/ui/team-crest";
import { FlagImage } from "@/components/ui/flag-image";
import { MATCH_STATUS_LABELS } from "@/constants";
import type { Match } from "@/types/fixtures";

interface MatchCardProps {
  match: Match;
  showPrediction?: boolean;
  prediction?: { home: number; away: number } | null;
  onClick?: () => void;
  compact?: boolean;
}

export function MatchCard({ match, showPrediction, prediction, onClick, compact }: MatchCardProps) {
  const { formatTime, formatDateShort } = useFormatDate();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      whileTap={{ scale: onClick ? 0.99 : 1 }}
      onClick={onClick}
      className={cn(
        "glass rounded-xl border border-border/50 transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-primary/5",
        compact ? "p-3" : "p-4"
      )}
    >
      {/* Header: date & status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDateShort(match.match_date)}</span>
          <span>·</span>
          <span>{formatTime(match.match_date)}</span>
        </div>
        <Badge
          variant={
            isLive ? "live" : isFinished ? "secondary" : "outline"
          }
          className="text-[10px] h-5"
        >
          {isLive ? "● EN VIVO" : MATCH_STATUS_LABELS[match.status]}
        </Badge>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className={cn("font-semibold text-sm text-right", compact && "text-xs")}>
            {match.home_team?.short_name ?? "TBD"}
          </span>
          <TeamCrest team={match.home_team as any} size={compact ? "xs" : "sm"} showCrest={false} />
        </div>

        {/* Score / VS */}
        <div className={cn(
          "flex flex-col items-center gap-0.5 min-w-[64px] justify-center",
          compact && "min-w-[48px]"
        )}>
          {hasScore ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold text-lg tabular-nums", isLive && "text-red-400", compact && "text-base")}>
                  {match.home_score}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn("font-bold text-lg tabular-nums", isLive && "text-red-400", compact && "text-base")}>
                  {match.away_score}
                </span>
              </div>
              {match.api_football_status === "PEN" && (
                <span className="text-[9px] font-semibold text-amber-400 leading-none">
                  ({match.home_score_penalties}-{match.away_score_penalties} PEN)
                </span>
              )}
              {match.api_football_status === "AET" && (
                <span className="text-[9px] font-semibold text-blue-400 leading-none">ET</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-sm font-medium">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          <TeamCrest team={match.away_team as any} size={compact ? "xs" : "sm"} showCrest={false} />
          <span className={cn("font-semibold text-sm", compact && "text-xs")}>
            {match.away_team?.short_name ?? "TBD"}
          </span>
        </div>
      </div>

      {/* Venue */}
      {!compact && match.city && (
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{match.city}</span>
        </div>
      )}

      {/* Referee */}
      {!compact && (match as any).referee && (
        <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-muted-foreground/70">
          {(match as any).referee_country && (
            <FlagImage countryName={(match as any).referee_country} size="sm" className="opacity-80" />
          )}
          <span>Árb: {(match as any).referee}</span>
        </div>
      )}

      {/* Prediction badge */}
      {showPrediction && prediction && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Tu predicción:</span>
          <span className="text-xs font-bold text-primary">
            {prediction.home} - {prediction.away}
          </span>
        </div>
      )}
    </motion.div>
  );
}
