"use client";

// Maps FIFA 3-letter codes → ISO 2-letter codes for flagcdn.com
const FIFA_TO_ISO: Record<string, string> = {
  USA: "us", MEX: "mx", CAN: "ca", PAN: "pa", HON: "hn", JAM: "jm", CRC: "cr",
  ARG: "ar", BRA: "br", COL: "co", ECU: "ec", URU: "uy", VEN: "ve", BOL: "bo",
  CHI: "cl", PAR: "py", PER: "pe",
  ESP: "es", FRA: "fr", ENG: "gb-eng", GER: "de", POR: "pt", NED: "nl",
  BEL: "be", SRB: "rs", CRO: "hr", HUN: "hu", AUT: "at", DEN: "dk",
  SCO: "gb-sct", SVK: "sk", POL: "pl", TUR: "tr", ITA: "it", GRE: "gr",
  SUI: "ch", WAL: "gb-wls", NIR: "gb-nir", CZE: "cz", ROM: "ro", ALB: "al",
  JPN: "jp", KOR: "kr", IRN: "ir", KSA: "sa", AUS: "au", UZB: "uz",
  JOR: "jo", IRQ: "iq", CHN: "cn", THA: "th", QAT: "qa", UAE: "ae",
  MAR: "ma", SEN: "sn", NGA: "ng", EGY: "eg", CMR: "cm", GHA: "gh",
  CIV: "ci", RSA: "za", TUN: "tn", ALG: "dz", MLI: "ml", COD: "cd",
  NZL: "nz",
  IDN: "id", ZAF: "za",
};

interface FlagImageProps {
  fifaCode: string;
  fallbackEmoji?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm:  { w: 24, h: 16, cls: "w-6 h-4" },
  md:  { w: 32, h: 22, cls: "w-8 h-[22px]" },
  lg:  { w: 48, h: 32, cls: "w-12 h-8" },
  xl:  { w: 80, h: 54, cls: "w-20 h-[54px]" },
};

export function FlagImage({ fifaCode, fallbackEmoji, size = "md", className = "" }: FlagImageProps) {
  const iso = FIFA_TO_ISO[fifaCode.toUpperCase()];
  const { w, h, cls } = SIZES[size];

  if (!iso) {
    return (
      <span className={`text-2xl leading-none ${className}`}>{fallbackEmoji ?? fifaCode}</span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${iso}.png`}
      srcSet={`https://flagcdn.com/${w * 2}x${h * 2}/${iso}.png 2x`}
      width={w}
      height={h}
      alt={fifaCode}
      className={`object-cover rounded-sm shadow-sm inline-block ${cls} ${className}`}
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        img.style.display = "none";
        const span = document.createElement("span");
        span.textContent = fallbackEmoji ?? fifaCode;
        span.className = "text-2xl leading-none";
        img.parentNode?.insertBefore(span, img);
      }}
    />
  );
}
