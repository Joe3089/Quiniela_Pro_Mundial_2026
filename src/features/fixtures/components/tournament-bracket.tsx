"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { Celebration } from "@/components/ui/celebration";
import { cn, formatDateShort } from "@/lib/utils";
import { localCrestUrl, podiumCrestUrl, championCrestUrl } from "@/data/team-crests";
import type { BracketRound, BracketMatch } from "@/types/fixtures";
import type { TeamRow } from "@/types/database";

// ── Local-only crest image (never falls back to an API/flag source) ──────────
function Crest({
  fifaCode,
  name,
  size = 20,
  resolver = localCrestUrl,
  className,
}: {
  fifaCode?: string | null;
  name?: string | null;
  size?: number;
  resolver?: (code?: string | null) => string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolver(fifaCode);
  if (!src || failed) {
    return (
      <div
        className={cn("rounded bg-white/10 border border-white/10 flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <span className="text-[7px] font-black text-white/60 uppercase">{fifaCode?.slice(0, 3) ?? "?"}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name ?? fifaCode ?? ""}
      width={size}
      height={size}
      className={cn("object-contain shrink-0", className)}
      onError={() => setFailed(true)}
    />
  );
}

// Winner/loser of the 3rd-place match → podium
function getPodium(thirdMatch: BracketMatch | null): { third: TeamRow | null; fourth: TeamRow | null } {
  if (!thirdMatch || thirdMatch.home_score == null || thirdMatch.away_score == null) {
    return { third: null, fourth: null };
  }
  let homeWon = thirdMatch.home_score > thirdMatch.away_score;
  if (thirdMatch.home_score === thirdMatch.away_score) {
    const hp = thirdMatch.match?.home_score_penalties ?? 0;
    const ap = thirdMatch.match?.away_score_penalties ?? 0;
    homeWon = hp > ap;
  }
  return homeWon
    ? { third: thirdMatch.home_team, fourth: thirdMatch.away_team }
    : { third: thirdMatch.away_team, fourth: thirdMatch.home_team };
}

const WCTrophy = dynamic(() => import("@/components/ui/wc-trophy"), {
  ssr: false,
  loading: () => <div style={{ width: 110, height: 110 }} />,
});

// ── R32 seeding labels per bracket_slot (0-15) ───────────────────────────────
const R32_SEEDS: Record<number, { home: string; away: string }> = {
  0:  { home: "1E",  away: "3ABCDF" },
  1:  { home: "1I",  away: "3CDFGH" },
  2:  { home: "2A",  away: "2B"     },
  3:  { home: "1F",  away: "2C"     },
  4:  { home: "2K",  away: "2L"     },  // M83
  5:  { home: "1H",  away: "2J"     },  // M84
  6:  { home: "1D",  away: "3BEFIJ" },  // M81
  7:  { home: "1G",  away: "3AHIJ"  },  // M82
  8:  { home: "1C",  away: "2F"     },  // M76
  9:  { home: "2E",  away: "2I"     },  // M78
  10: { home: "1A",  away: "3CEFHI" },  // M79
  11: { home: "1L",  away: "3EHIJK" },  // M80
  12: { home: "1J",  away: "2H"     },  // M86
  13: { home: "2D",  away: "2G"     },  // M88
  14: { home: "1B",  away: "3EFGIJ" },  // M85
  15: { home: "1K",  away: "3DEIJL" },  // M87
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SLOT_H = 90;              // height per slot in R32 column
const SLOTS = 8;                // R32 matches per side
const TOTAL_H = SLOT_H * SLOTS; // 720px
const CARD_W = 148;             // match card width
const CONN_W = 22;              // connector SVG width between rounds
const EXT_W = 38;               // connector extension on each side of Final card
const TROPHY_SIZE = 106;        // trophy render size
const FINAL_CARD_H = 76;        // approximate height of a match card

const STROKE = "rgba(255,255,255,0.18)";

// ── Match Card ─────────────────────────────────────────────────────────────────
function MatchCard({ match, gold, slotIdx }: { match: BracketMatch | null; gold?: boolean; slotIdx?: number }) {
  const hasScore = match && match.home_score !== null && match.away_score !== null;
  const isLive = match?.status === "live";
  const afStatus = match?.match?.api_football_status;
  const isPen = afStatus === "PEN";
  const isAet = afStatus === "AET";

  const renderTeam = (
    team: BracketMatch["home_team"],
    score: number | null,
    isHome: boolean
  ) => {
    const won =
      hasScore &&
      ((isHome && (match!.home_score ?? 0) > (match!.away_score ?? 0)) ||
        (!isHome && (match!.away_score ?? 0) > (match!.home_score ?? 0)));
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-[5px]", won && "bg-primary/10", !team && "opacity-40")}>
        {team ? (
          <Crest fifaCode={team.fifa_code} name={team.name} size={20} />
        ) : (
          <div className="w-5 h-5 rounded bg-muted/40 shrink-0" />
        )}
        <span className={cn("text-[11px] font-medium flex-1 truncate max-w-[68px]", won ? "text-foreground font-bold" : "text-muted-foreground", !team && "italic text-[10px]")}>
          {team?.short_name ?? (
            slotIdx !== undefined && R32_SEEDS[slotIdx]
              ? (isHome ? R32_SEEDS[slotIdx].home : R32_SEEDS[slotIdx].away)
              : "TBD"
          )}
        </span>
        {hasScore && (
          <span className={cn("text-[11px] font-bold tabular-nums w-3.5 text-right shrink-0", won ? "text-primary" : "text-muted-foreground", isLive && "text-red-400")}>
            {score}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "glass rounded-lg border overflow-hidden shrink-0",
        isLive ? "border-red-500/40" : gold ? "border-yellow-500/50 shadow-[0_0_14px_rgba(234,179,8,0.18)]" : "border-border/40"
      )}
      style={{ width: CARD_W }}
    >
      {match?.match_date && (
        <div className={cn("px-2 py-0.5 border-b border-border/20 flex items-center gap-1", gold ? "bg-yellow-500/10" : "bg-muted/30")}>
          <span className="text-[9px] text-muted-foreground flex-1">{formatDateShort(match.match_date)}</span>
          {isLive && <span className="text-[9px] text-red-400 font-bold animate-pulse">● LIVE</span>}
          {isPen && <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">PEN</span>}
          {isAet && <span className="text-[8px] font-bold text-blue-400 bg-blue-400/10 px-1 rounded">ET</span>}
        </div>
      )}
      <div className="divide-y divide-border/20">
        {renderTeam(match?.home_team ?? null, match?.home_score ?? null, true)}
        {renderTeam(match?.away_team ?? null, match?.away_score ?? null, false)}
      </div>
      {isPen && match?.match?.home_score_penalties != null && (
        <div className="px-2 py-0.5 text-center border-t border-border/10 bg-amber-400/5">
          <span className="text-[8px] text-amber-400 font-semibold tabular-nums">
            {match.match.home_score_penalties} - {match.match.away_score_penalties} pen.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Connector SVG — connects pairs from one round to the next ─────────────────
// sourceCount = matches in source round (per side); dir = which way lines point
function ConnSVG({ n, dir }: { n: number; dir: "r" | "l" }) {
  if (n <= 0) return null;
  const W = CONN_W;
  const paths: string[] = [];

  if (n === 1) {
    // Just a horizontal line at centre — SF→Final/SF handled by CenterSection
    return null;
  }

  const pairs = Math.floor(n / 2);
  for (let i = 0; i < pairs; i++) {
    const y1 = (TOTAL_H * (2 * i + 0.5)) / n;
    const y2 = (TOTAL_H * (2 * i + 1.5)) / n;
    const ym = (TOTAL_H * (2 * i + 1)) / n;
    if (dir === "r") {
      // Top arm → bracket midpoint → bottom arm (H 0 completes bottom connector)
      paths.push(`M 0 ${y1} H ${W / 2} V ${y2} H 0 M ${W / 2} ${ym} H ${W}`);
    } else {
      // Mirror for right side
      paths.push(`M ${W} ${y1} H ${W / 2} V ${y2} H ${W} M ${W / 2} ${ym} H 0`);
    }
  }

  return (
    <svg width={W} height={TOTAL_H} fill="none" className="shrink-0" style={{ display: "block" }}>
      {paths.map((d, i) => <path key={i} d={d} stroke={STROKE} strokeWidth="1.5" />)}
    </svg>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────
function RoundCol({ matches, slotOffset = 0 }: { matches: (BracketMatch | null)[]; slotOffset?: number }) {
  return (
    <div className="flex flex-col justify-around shrink-0" style={{ height: TOTAL_H, width: CARD_W }}>
      {matches.map((m, i) => (
        <MatchCard
          key={m?.id ?? `e${i}`}
          match={m}
          slotIdx={m?.phase === "round_of_32" ? slotOffset + i : undefined}
        />
      ))}
    </div>
  );
}

// ── Center section: Trophy + Final card + SF→Final connectors + 3rd place ────
function CenterSection({
  finalMatch,
  thirdMatch,
  champion,
}: {
  finalMatch: BracketMatch | null;
  thirdMatch: BracketMatch | null;
  champion?: TeamRow | null;
}) {
  const centerW = EXT_W + CARD_W + EXT_W;
  const ym = TOTAL_H / 2;
  const trophyTop = ym - FINAL_CARD_H / 2 - TROPHY_SIZE - 14;
  const cardTop = ym - FINAL_CARD_H / 2;
  // Champion crest + stars sit right under the Final card
  const championTop = cardTop + FINAL_CARD_H + 8;
  // 3rd place: positioned below the champion block
  const thirdLabelTop = championTop + 70;
  const thirdCardTop = thirdLabelTop + 16;
  const resultsTop = thirdCardTop + FINAL_CARD_H + 14;
  const { third, fourth } = getPodium(thirdMatch);

  return (
    <div className="relative shrink-0" style={{ width: centerW, height: TOTAL_H }}>
      {/* SF connector lines at exact midpoint */}
      <svg className="absolute inset-0 pointer-events-none" width={centerW} height={TOTAL_H} fill="none">
        <line x1={0} y1={ym} x2={EXT_W} y2={ym} stroke={STROKE} strokeWidth="1.5" />
        <line x1={EXT_W + CARD_W} y1={ym} x2={centerW} y2={ym} stroke={STROKE} strokeWidth="1.5" />
        {/* dashed connector from Final to 3rd place */}
        {thirdMatch && (
          <line
            x1={centerW / 2} y1={cardTop + FINAL_CARD_H}
            x2={centerW / 2} y2={thirdLabelTop}
            stroke={STROKE} strokeWidth="1.2" strokeDasharray="3 2"
          />
        )}
      </svg>

      {/* Trophy — spins continuously once a champion is crowned */}
      <div
        className={cn("absolute", champion && "animate-[spin_6s_linear_infinite]")}
        style={{ left: EXT_W + (CARD_W - TROPHY_SIZE) / 2 - 8, top: trophyTop }}
      >
        <WCTrophy size={TROPHY_SIZE} />
      </div>

      {/* Final match card */}
      <div className="absolute" style={{ left: EXT_W, top: cardTop, width: CARD_W }}>
        <MatchCard match={finalMatch} gold />
      </div>

      {/* Champion: official crest (original stars are part of the artwork) + label + celebration */}
      {champion && (
        <div className="absolute flex flex-col items-center gap-1" style={{ left: EXT_W, top: championTop, width: CARD_W }}>
          <Celebration w={CARD_W} h={160} />
          <Crest
            fifaCode={champion.fifa_code}
            name={champion.name}
            size={56}
            resolver={championCrestUrl}
            className="animate-[spin_6s_linear_infinite] drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]"
          />
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Campeón</span>
        </div>
      )}

      {/* 3rd place label + card */}
      {thirdMatch && (
        <>
          <div className="absolute flex items-center justify-center" style={{ left: EXT_W, top: thirdLabelTop, width: CARD_W }}>
            <span className="text-[8px] font-black text-muted-foreground/70 uppercase tracking-widest">
              3er Lugar
            </span>
          </div>
          <div className="absolute" style={{ left: EXT_W, top: thirdCardTop, width: CARD_W }}>
            <MatchCard match={thirdMatch} />
          </div>
        </>
      )}

      {/* Resultados Finales: 3rd/4th place podium */}
      {(third || fourth) && (
        <div className="absolute" style={{ left: 0, top: resultsTop, width: centerW }}>
          <div className="glass rounded-lg border border-border/30 px-2 py-2">
            <div className="text-center text-[7px] font-black text-muted-foreground/70 uppercase tracking-widest mb-1.5">
              Resultados Finales
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-0.5">
                <Crest fifaCode={third?.fifa_code} name={third?.name} size={42} resolver={podiumCrestUrl} />
                <span className="text-[7px] font-bold text-amber-400 uppercase tracking-wide">3er Lugar</span>
                <span className="text-[8px] font-semibold text-foreground truncate max-w-[80px]">
                  {third?.short_name ?? third?.name}
                </span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Crest fifaCode={fourth?.fifa_code} name={fourth?.name} size={42} resolver={podiumCrestUrl} />
                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-wide">4to Lugar</span>
                <span className="text-[8px] font-semibold text-foreground truncate max-w-[80px]">
                  {fourth?.short_name ?? fourth?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Round label ───────────────────────────────────────────────────────────────
function RoundLabel({ label, width, gold }: { label: string; width: number; gold?: boolean }) {
  return (
    <div className="text-center shrink-0 pb-1" style={{ width }}>
      <span className={cn("text-[9px] font-black uppercase tracking-widest", gold ? "text-yellow-400/80" : "text-primary/55")}>
        {label}
      </span>
    </div>
  );
}

// ── Pad / slice helpers ───────────────────────────────────────────────────────
function padTo(arr: BracketMatch[], n: number): (BracketMatch | null)[] {
  const out: (BracketMatch | null)[] = arr.slice(0, n);
  while (out.length < n) out.push(null);
  return out;
}

// ── Main component ────────────────────────────────────────────────────────────
interface TournamentBracketProps {
  rounds: BracketRound[];
  champion?: TeamRow | null;
}

export function TournamentBracket({ rounds, champion }: TournamentBracketProps) {
  const get = (phase: string) => rounds.find((r) => r.phase === phase)?.matches ?? [];

  const r32All = get("round_of_32");
  const r16All = get("round_of_16");
  const qfAll  = get("quarter_final");
  const sfAll  = get("semi_final");
  const finalAll = get("final");
  const thirdAll = get("third_place");

  const r32L = padTo(r32All.slice(0, 8), 8);
  const r32R = padTo(r32All.slice(8, 16), 8);
  const r16L = padTo(r16All.slice(0, 4), 4);
  const r16R = padTo(r16All.slice(4, 8), 4);
  const qfL  = padTo(qfAll.slice(0, 2), 2);
  const qfR  = padTo(qfAll.slice(2, 4), 2);
  const sfL  = padTo(sfAll.slice(0, 1), 1);
  const sfR  = padTo(sfAll.slice(1, 2), 1);
  const finalMatch = finalAll[0] ?? null;

  // Column widths for label row
  const roundW   = CARD_W + CONN_W; // 170
  const centerW  = EXT_W + CARD_W + EXT_W; // 224
  const sfW      = CARD_W; // SF has no connector after (handled by CenterSection)
  const sfConnW  = 0; // we skip C1 connector — CenterSection handles it

  void sfConnW; void sfW;

  // Left side = 3*(CARD_W+CONN_W) + CARD_W(SF) = 658px
  const leftSideW = 3 * roundW + CARD_W;  // 510 + 148 = 658
  void leftSideW;

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pb-6">
      <div style={{ minWidth: "max-content" }}>

        {/* ── Label row ──────────────────────────────────────────────────── */}
        <div className="flex items-end mb-2" style={{ gap: 0 }}>
          <RoundLabel label="Dieciseisavos" width={roundW} />
          <RoundLabel label="Octavos" width={roundW} />
          <RoundLabel label="Cuartos" width={roundW} />
          <RoundLabel label="Semifinal" width={CARD_W} />
          <RoundLabel label="Final" width={centerW} gold />
          <RoundLabel label="Semifinal" width={CARD_W} />
          <RoundLabel label="Cuartos" width={roundW} />
          <RoundLabel label="Octavos" width={roundW} />
          <RoundLabel label="Dieciseisavos" width={roundW} />
        </div>

        {/* ── Bracket row ────────────────────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: 0 }}>
          <RoundCol matches={r32L} slotOffset={0} />
          <ConnSVG n={8} dir="r" />
          <RoundCol matches={r16L} />
          <ConnSVG n={4} dir="r" />
          <RoundCol matches={qfL} />
          <ConnSVG n={2} dir="r" />
          <RoundCol matches={sfL} />
          <CenterSection finalMatch={finalMatch} thirdMatch={thirdAll[0] ?? null} champion={champion} />
          <RoundCol matches={sfR} />
          <ConnSVG n={2} dir="l" />
          <RoundCol matches={qfR} />
          <ConnSVG n={4} dir="l" />
          <RoundCol matches={r16R} />
          <ConnSVG n={8} dir="l" />
          <RoundCol matches={r32R} slotOffset={8} />
        </div>


      </div>
    </div>
  );
}
