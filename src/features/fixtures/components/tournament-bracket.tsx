"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { cn, formatDateShort } from "@/lib/utils";
import { FlagImage } from "@/components/ui/flag-image";
import type { BracketRound, BracketMatch } from "@/types/fixtures";

const WCTrophy = dynamic(() => import("@/components/ui/wc-trophy"), {
  ssr: false,
  loading: () => <div style={{ width: 110, height: 110 }} />,
});

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOT_H = 90;           // height of one slot in R32 column (px)
const NUM_SLOTS = 8;         // R32 matches per side
const TOTAL_H = SLOT_H * NUM_SLOTS; // 720px total bracket height
const CARD_W = 148;          // match card width (px)
const CONN_W = 22;           // connector SVG width (px)

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({ match, gold }: { match: BracketMatch | null; gold?: boolean }) {
  const hasScore = match && match.home_score !== null && match.away_score !== null;
  const isLive = match?.status === "live";

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
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-[5px]",
          won && "bg-primary/10",
          !team && "opacity-40"
        )}
      >
        {team?.fifa_code ? (
          <FlagImage fifaCode={team.fifa_code} size="sm" className="shrink-0" />
        ) : team?.flag_url ? (
          <Image
            src={team.flag_url}
            alt={team.name ?? ""}
            width={18}
            height={12}
            className="rounded-sm object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-[18px] h-3 rounded-sm bg-muted/40 shrink-0" />
        )}
        <span
          className={cn(
            "text-[11px] font-medium flex-1 truncate max-w-[68px]",
            won ? "text-foreground font-bold" : "text-muted-foreground",
            !team && "italic"
          )}
        >
          {team?.short_name ?? "TBD"}
        </span>
        {hasScore && (
          <span
            className={cn(
              "text-[11px] font-bold tabular-nums w-3.5 text-right shrink-0",
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
    <div
      className={cn(
        "glass rounded-lg border overflow-hidden shrink-0",
        isLive
          ? "border-red-500/40"
          : gold
          ? "border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
          : "border-border/40"
      )}
      style={{ width: CARD_W }}
    >
      {match?.match_date && (
        <div
          className={cn(
            "px-2 py-0.5 border-b border-border/20",
            gold ? "bg-yellow-500/10" : "bg-muted/30"
          )}
        >
          <span className="text-[9px] text-muted-foreground">
            {formatDateShort(match.match_date)}
          </span>
          {isLive && (
            <span className="ml-1 text-[9px] text-red-400 font-bold animate-pulse">
              ● LIVE
            </span>
          )}
        </div>
      )}
      <div className="divide-y divide-border/20">
        {renderTeam(match?.home_team ?? null, match?.home_score ?? null, true)}
        {renderTeam(match?.away_team ?? null, match?.away_score ?? null, false)}
      </div>
    </div>
  );
}

// ── Connector SVG ─────────────────────────────────────────────────────────────
// sourceCount = number of matches in the source round (per side)
// Each pair of source matches feeds one target match
function ConnectorSVG({
  sourceCount,
  dir,
}: {
  sourceCount: number;
  dir: "right" | "left";
}) {
  if (sourceCount <= 0) return null;

  const paths: string[] = [];
  const stroke = "rgba(255,255,255,0.17)";

  if (sourceCount === 1) {
    // Simple horizontal at vertical center
    const ym = TOTAL_H / 2;
    paths.push(dir === "right" ? `M 0 ${ym} H ${CONN_W}` : `M ${CONN_W} ${ym} H 0`);
  } else {
    const pairs = Math.floor(sourceCount / 2);
    for (let i = 0; i < pairs; i++) {
      const y1 = (TOTAL_H * (2 * i + 0.5)) / sourceCount;
      const y2 = (TOTAL_H * (2 * i + 1.5)) / sourceCount;
      const ym = (TOTAL_H * (2 * i + 1)) / sourceCount;
      if (dir === "right") {
        paths.push(
          `M 0 ${y1} H ${CONN_W / 2} V ${y2} M ${CONN_W / 2} ${ym} H ${CONN_W}`
        );
      } else {
        paths.push(
          `M ${CONN_W} ${y1} H ${CONN_W / 2} V ${y2} M ${CONN_W / 2} ${ym} H 0`
        );
      }
    }
  }

  return (
    <svg
      width={CONN_W}
      height={TOTAL_H}
      fill="none"
      className="shrink-0"
      style={{ display: "block" }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ── Round Column ──────────────────────────────────────────────────────────────
function RoundColumn({
  matches,
  gold,
}: {
  matches: (BracketMatch | null)[];
  gold?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-around shrink-0"
      style={{ height: TOTAL_H, width: CARD_W }}
    >
      {matches.map((m, i) => (
        <MatchCard key={m?.id ?? `empty-${i}`} match={m} gold={gold} />
      ))}
    </div>
  );
}

// ── Column Label ──────────────────────────────────────────────────────────────
function ColLabel({
  label,
  width,
  gold,
}: {
  label: string;
  width: number;
  gold?: boolean;
}) {
  return (
    <div
      className="text-center shrink-0 pb-1"
      style={{ width }}
    >
      <span
        className={cn(
          "text-[9px] font-black uppercase tracking-widest",
          gold ? "text-yellow-400/80" : "text-primary/60"
        )}
      >
        {label}
      </span>
    </div>
  );
}

// ── Pad array to fixed length ─────────────────────────────────────────────────
function padMatches(arr: BracketMatch[], n: number): (BracketMatch | null)[] {
  const out: (BracketMatch | null)[] = [...arr];
  while (out.length < n) out.push(null);
  return out.slice(0, n);
}

// ── Main component ────────────────────────────────────────────────────────────
interface TournamentBracketProps {
  rounds: BracketRound[];
  champion?: { name: string; flag_url?: string | null } | null;
}

export function TournamentBracket({ rounds, champion }: TournamentBracketProps) {
  const get = (phase: string) =>
    rounds.find((r) => r.phase === phase)?.matches ?? [];

  const r32All = get("round_of_32");
  const r16All = get("round_of_16");
  const qfAll = get("quarter_final");
  const sfAll = get("semi_final");
  const finalAll = get("final");
  const thirdAll = get("third_place");

  // Split each round into left (first half) and right (second half)
  const r32L = padMatches(r32All.slice(0, 8), 8);
  const r32R = padMatches(r32All.slice(8, 16), 8);
  const r16L = padMatches(r16All.slice(0, 4), 4);
  const r16R = padMatches(r16All.slice(4, 8), 4);
  const qfL = padMatches(qfAll.slice(0, 2), 2);
  const qfR = padMatches(qfAll.slice(2, 4), 2);
  const sfL = padMatches(sfAll.slice(0, 1), 1);
  const sfR = padMatches(sfAll.slice(1, 2), 1);
  const finalMatch = finalAll[0] ?? null;

  // Column widths for label row
  const roundW = CARD_W + CONN_W;
  const centerW = CARD_W + 120; // card + trophy space

  const leftLabels = [
    { label: "Dieciseisavos", w: roundW },
    { label: "Octavos", w: roundW },
    { label: "Cuartos", w: roundW },
    { label: "Semifinal", w: roundW },
  ];
  const rightLabels = [
    { label: "Semifinal", w: roundW },
    { label: "Cuartos", w: roundW },
    { label: "Octavos", w: roundW },
    { label: "Dieciseisavos", w: roundW },
  ];

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pb-6">
      <div style={{ minWidth: "max-content" }}>

        {/* ── Label row ─────────────────────────────────────────────── */}
        <div className="flex items-end mb-2" style={{ gap: 0 }}>
          {leftLabels.map(({ label, w }, i) => (
            <ColLabel key={`L${i}`} label={label} width={w} />
          ))}
          <ColLabel label="Final" width={centerW} gold />
          {rightLabels.map(({ label, w }, i) => (
            <ColLabel key={`R${i}`} label={label} width={w} />
          ))}
        </div>

        {/* ── Bracket row ───────────────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: 0 }}>

          {/* Left half: R32 → R16 → QF → SF → */}
          <RoundColumn matches={r32L} />
          <ConnectorSVG sourceCount={8} dir="right" />
          <RoundColumn matches={r16L} />
          <ConnectorSVG sourceCount={4} dir="right" />
          <RoundColumn matches={qfL} />
          <ConnectorSVG sourceCount={2} dir="right" />
          <RoundColumn matches={sfL} />
          <ConnectorSVG sourceCount={1} dir="right" />

          {/* Center: Trophy + Final card */}
          <div
            className="flex flex-col items-center justify-center gap-3 shrink-0"
            style={{ height: TOTAL_H, width: centerW }}
          >
            <WCTrophy size={110} />
            <MatchCard match={finalMatch} gold />
            {champion && (
              <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 border border-yellow-500/30">
                <span className="text-[10px] font-bold text-yellow-400">
                  🏆 {champion.name}
                </span>
              </div>
            )}
          </div>

          {/* Right half: ← SF ← QF ← R16 ← R32 */}
          <ConnectorSVG sourceCount={1} dir="left" />
          <RoundColumn matches={sfR} />
          <ConnectorSVG sourceCount={2} dir="left" />
          <RoundColumn matches={qfR} />
          <ConnectorSVG sourceCount={4} dir="left" />
          <RoundColumn matches={r16R} />
          <ConnectorSVG sourceCount={8} dir="left" />
          <RoundColumn matches={r32R} />
        </div>

        {/* ── Third place ───────────────────────────────────────────── */}
        {thirdAll.length > 0 && (
          <div className="mt-8 ml-2">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              Partido por el 3er Lugar
            </p>
            <div className="flex gap-2">
              {thirdAll.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
