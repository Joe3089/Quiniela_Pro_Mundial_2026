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
      <div className={cn("flex items-center gap-1.5 px-2 py-[5px]", won && "bg-primary/10", !team && "opacity-40")}>
        {team?.fifa_code ? (
          <FlagImage fifaCode={team.fifa_code} size="sm" className="shrink-0" />
        ) : team?.flag_url ? (
          <Image src={team.flag_url} alt={team.name ?? ""} width={18} height={12} className="rounded-sm object-cover shrink-0" unoptimized />
        ) : (
          <div className="w-[18px] h-3 rounded-sm bg-muted/40 shrink-0" />
        )}
        <span className={cn("text-[11px] font-medium flex-1 truncate max-w-[68px]", won ? "text-foreground font-bold" : "text-muted-foreground", !team && "italic")}>
          {team?.short_name ?? "TBD"}
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
        <div className={cn("px-2 py-0.5 border-b border-border/20", gold ? "bg-yellow-500/10" : "bg-muted/30")}>
          <span className="text-[9px] text-muted-foreground">{formatDateShort(match.match_date)}</span>
          {isLive && <span className="ml-1 text-[9px] text-red-400 font-bold animate-pulse">● LIVE</span>}
        </div>
      )}
      <div className="divide-y divide-border/20">
        {renderTeam(match?.home_team ?? null, match?.home_score ?? null, true)}
        {renderTeam(match?.away_team ?? null, match?.away_score ?? null, false)}
      </div>
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
      paths.push(`M 0 ${y1} H ${W / 2} V ${y2} M ${W / 2} ${ym} H ${W}`);
    } else {
      paths.push(`M ${W} ${y1} H ${W / 2} V ${y2} M ${W / 2} ${ym} H 0`);
    }
  }

  return (
    <svg width={W} height={TOTAL_H} fill="none" className="shrink-0" style={{ display: "block" }}>
      {paths.map((d, i) => <path key={i} d={d} stroke={STROKE} strokeWidth="1.5" />)}
    </svg>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────
function RoundCol({ matches }: { matches: (BracketMatch | null)[] }) {
  return (
    <div className="flex flex-col justify-around shrink-0" style={{ height: TOTAL_H, width: CARD_W }}>
      {matches.map((m, i) => <MatchCard key={m?.id ?? `e${i}`} match={m} />)}
    </div>
  );
}

const THIRD_DROP_H = 10;   // gap between Final bottom and 3rd place label
const THIRD_LABEL_H = 16;  // height of "3er Lugar" label row

// ── Center section: Trophy + Final card + SF→Final connectors + 3rd Place ────
function CenterSection({
  finalMatch,
  thirdPlaceMatch,
  champion,
}: {
  finalMatch: BracketMatch | null;
  thirdPlaceMatch: BracketMatch | null;
  champion?: { name: string; flag_url?: string | null } | null;
}) {
  const centerW = EXT_W + CARD_W + EXT_W;
  const ym = TOTAL_H / 2;
  const trophyTop = ym - FINAL_CARD_H / 2 - TROPHY_SIZE - 14;
  const cardTop = ym - FINAL_CARD_H / 2;
  const thirdLabelTop = cardTop + FINAL_CARD_H + THIRD_DROP_H;
  const thirdCardTop  = thirdLabelTop + THIRD_LABEL_H;

  return (
    <div className="relative shrink-0" style={{ width: centerW, height: TOTAL_H }}>
      {/* SF connector lines at exact midpoint */}
      <svg className="absolute inset-0 pointer-events-none" width={centerW} height={TOTAL_H} fill="none">
        <line x1={0} y1={ym} x2={EXT_W} y2={ym} stroke={STROKE} strokeWidth="1.5" />
        <line x1={EXT_W + CARD_W} y1={ym} x2={centerW} y2={ym} stroke={STROKE} strokeWidth="1.5" />
      </svg>

      {/* Trophy */}
      <div className="absolute" style={{ left: EXT_W + (CARD_W - TROPHY_SIZE) / 2 - 8, top: trophyTop }}>
        <WCTrophy size={TROPHY_SIZE} />
      </div>

      {/* Final match card */}
      <div className="absolute" style={{ left: EXT_W, top: cardTop, width: CARD_W }}>
        <MatchCard match={finalMatch} gold />
      </div>

      {/* Champion label (replaces 3rd place when final is decided) */}
      {champion && !thirdPlaceMatch && (
        <div className="absolute flex items-center justify-center" style={{ left: EXT_W, top: cardTop + FINAL_CARD_H + 8, width: CARD_W }}>
          <div className="glass rounded-lg px-3 py-1 border border-yellow-500/30">
            <span className="text-[10px] font-bold text-yellow-400">🏆 {champion.name}</span>
          </div>
        </div>
      )}

      {/* Third place — immediately below the Final card */}
      {thirdPlaceMatch && (
        <>
          {/* Short dashed connector */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: centerW / 2 - 1, top: cardTop + FINAL_CARD_H }}
            width={2}
            height={THIRD_DROP_H}
            fill="none"
          >
            <line x1={1} y1={0} x2={1} y2={THIRD_DROP_H} stroke={STROKE} strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
          {/* Label */}
          <div
            className="absolute flex justify-center items-center"
            style={{ left: EXT_W, top: thirdLabelTop, width: CARD_W, height: THIRD_LABEL_H }}
          >
            <span className="text-[8px] font-black text-muted-foreground/70 uppercase tracking-widest">
              3er Lugar
            </span>
          </div>
          {/* Card */}
          <div className="absolute" style={{ left: EXT_W, top: thirdCardTop, width: CARD_W }}>
            <MatchCard match={thirdPlaceMatch} />
          </div>
        </>
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
  champion?: { name: string; flag_url?: string | null } | null;
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

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pb-6">
      <div style={{ minWidth: "max-content" }}>

        {/* ── Label row ──────────────────────────────────────────────────── */}
        <div className="flex items-end mb-2" style={{ gap: 0 }}>
          {/* Left labels */}
          <RoundLabel label="Dieciseisavos" width={roundW} />
          <RoundLabel label="Octavos" width={roundW} />
          <RoundLabel label="Cuartos" width={roundW} />
          {/* SF left: CARD_W only (no connector gap after since CenterSection handles it) */}
          <RoundLabel label="Semifinal" width={CARD_W} />
          {/* Center */}
          <RoundLabel label="Final" width={centerW} gold />
          {/* SF right */}
          <RoundLabel label="Semifinal" width={CARD_W} />
          {/* Right labels */}
          <RoundLabel label="Cuartos" width={roundW} />
          <RoundLabel label="Octavos" width={roundW} />
          <RoundLabel label="Dieciseisavos" width={roundW} />
        </div>

        {/* ── Bracket row ────────────────────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: 0 }}>

          {/* LEFT HALF */}
          <RoundCol matches={r32L} />
          <ConnSVG n={8} dir="r" />
          <RoundCol matches={r16L} />
          <ConnSVG n={4} dir="r" />
          <RoundCol matches={qfL} />
          <ConnSVG n={2} dir="r" />
          {/* SF left — no trailing connector; CenterSection starts immediately */}
          <RoundCol matches={sfL} />

          {/* CENTER: SF→Final connectors + Trophy + Final card + 3rd Place */}
          <CenterSection finalMatch={finalMatch} thirdPlaceMatch={thirdAll[0] ?? null} champion={champion} />

          {/* SF right — no leading connector; CenterSection ends here */}
          <RoundCol matches={sfR} />
          <ConnSVG n={2} dir="l" />
          <RoundCol matches={qfR} />
          <ConnSVG n={4} dir="l" />
          <RoundCol matches={r16R} />
          <ConnSVG n={8} dir="l" />
          <RoundCol matches={r32R} />
        </div>

      </div>
    </div>
  );
}
