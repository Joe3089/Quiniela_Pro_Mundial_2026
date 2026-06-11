"use client";

import Image from "next/image";

// Maps FIFA 3-letter codes → ISO 2-letter codes for flagcdn.com
const FIFA_TO_ISO: Record<string, string> = {
  // CONCACAF
  USA: "us", MEX: "mx", CAN: "ca", PAN: "pa", HON: "hn", JAM: "jm", CRC: "cr",
  CUW: "cw", HAI: "ht",
  // CONMEBOL
  ARG: "ar", BRA: "br", COL: "co", ECU: "ec", URU: "uy", VEN: "ve", BOL: "bo",
  CHI: "cl", PAR: "py", PER: "pe",
  // UEFA
  ESP: "es", FRA: "fr", ENG: "gb-eng", GER: "de", POR: "pt", NED: "nl",
  BEL: "be", SRB: "rs", CRO: "hr", HUN: "hu", AUT: "at", DEN: "dk",
  SCO: "gb-sct", SVK: "sk", POL: "pl", TUR: "tr", ITA: "it", GRE: "gr",
  SUI: "ch", WAL: "gb-wls", NIR: "gb-nir", CZE: "cz", ROM: "ro", ALB: "al",
  SWE: "se", NOR: "no", BIH: "ba",
  // AFC
  JPN: "jp", KOR: "kr", IRN: "ir", KSA: "sa", AUS: "au", UZB: "uz",
  JOR: "jo", IRQ: "iq", CHN: "cn", THA: "th", QAT: "qa", UAE: "ae",
  // CAF
  MAR: "ma", SEN: "sn", NGA: "ng", EGY: "eg", CMR: "cm", GHA: "gh",
  CIV: "ci", RSA: "za", TUN: "tn", ALG: "dz", MLI: "ml", COD: "cd", CPV: "cv",
  // OFC
  NZL: "nz",
  // Other
  IDN: "id", ZAF: "za",
};

interface FlagImageProps {
  fifaCode: string;
  fallbackEmoji?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// flagcdn.com ONLY supports these widths: 20, 40, 80, 160, 320
// Using unsupported widths (24, 32, 48, 64) returns 404
const SIZES = {
  sm:  { w: 20,  h: 13,  cls: "w-5 h-[13px]"  },
  md:  { w: 40,  h: 27,  cls: "w-10 h-[27px]" },
  lg:  { w: 80,  h: 54,  cls: "w-20 h-[54px]" },
  xl:  { w: 80,  h: 54,  cls: "w-20 h-[54px]" },
};

export function FlagImage({ fifaCode, fallbackEmoji, size = "md", className = "" }: FlagImageProps) {
  const iso = FIFA_TO_ISO[fifaCode?.toUpperCase() ?? ""];
  const { w, h, cls } = SIZES[size];

  if (!iso) {
    return (
      <span className={`text-xl leading-none ${className}`}>{fallbackEmoji ?? fifaCode}</span>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w${w}/${iso}.png`}
      alt={fifaCode}
      width={w}
      height={h}
      className={`object-cover rounded-sm shadow-sm ${cls} ${className}`}
      unoptimized
    />
  );
}
